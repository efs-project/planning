# Red team of the kinds ruling — attacks on the reconciled 5-kind data model

**Role:** red team for `kinds-ruling.md` (5 kinds + 2 ops + interned PROPERTY class + 14-row reserved-key table), read against `tags-maximalist.md`, `kind-set-conservative.md`, both app-grounding passes, and the frozen surfaces in `planning/Designs/efsv2/deterministic-ids.md`.
**Date:** 2026-07-07.
**Method:** for each collapse and each new frozen surface the ruling created, I constructed apps and relay/multi-device flows beyond the ten and looked for (a) silently dropped write-time guards, (b) cardinality/duplicate-policy failures under permissionless relay, (c) naming/categorizing confusion, (d) the 2076 regret. Every finding below names the concrete flow, the guard that died or the invariant that breaks, cites where the ruling created or inherited the hole, and prices the fix. Findings I could not make bite are in §4 so the next pass doesn't re-walk them.

**Headline: nothing fatal — no collapse has to be undone.** The 5-kind structure, both traps, and all four collapse adjudications survive attack. But the ruling ships with **seven serious defects**, and two of them (K1, K2) void specific sub-claims the ruling itself sells: K1 hollows the very appendOnly guarantee that was the stated reason for keeping LIST, and K2 shows the ruling applied its own replication-coherence principle selectively — it deleted one replication-hostile REVERT with a principle and kept three others that violate the same principle. All seven have cheap pre-freeze fixes; none is cheap after freeze.

---

## 1. Severity table

| # | Finding | Class | Severity | Voids a ruling claim? |
|---|---|---|---|---|
| K1 | appendOnly is hollowed by `expiresAt` (born-expiring entries + expiry mutation via in-place supersession) | dropped write-time guard | **SERIOUS, freeze-blocking** | Yes — §2.3's keep-LIST premise ("appendOnly enforcement dies with the declaration") and residual #3's "no app instance" |
| K2 | Selective replication-coherence: surviving admission REVERTs (appendOnly revoke-second, ListFull, list-typing on charter, possibly OPAQUE) poison envelopes and permit deliberately chain-selective envelopes | convergence / portability | **SERIOUS, freeze-blocking** | Yes — the §2.3 disposal-4 principle ("replaying … must converge, not revert") is applied to one gate and not the others |
| K3 | LIST config equivocation has no convergence rule — "first config governs forever" is chain-local first-arrival; same listId can be governed by different charters on different chains | duplicate-policy under relay | **SERIOUS** | Partially — §7's LIST row is under-specified for the case it exists for |
| K4 | `supersededBy` frozen as PIN (cardinality-1) cannot express many-to-one supersession (document splits; RFC-style obsoleted-by-multiple) | cardinality error in a frozen row | **SERIOUS** | No, but the row is Etched-wrong if it ships |
| K5 | OPAQUE targetKind is unadjudicated: deterministic-ids says "no dependency," conservative PI4 adds a negative-existence check; one horn is a portability-griefing vector, the other a dual-slot spelling | unadjudicated frozen surface | **SERIOUS** | The ruling never states the legal targetKind set at all |
| K6 | The expiry no-fallthrough read rule is an unscoped lens-wedging lever (expired claims block harder than revoked ones) | frozen read semantics | **SERIOUS (scoping)** | §4.1's read rule needs a context split it doesn't have |
| K7 | `successor` frozen as an active reserved row pre-KEL blesses key-theft trust migration | reserved-row overreach | **SERIOUS (demote)** | §4.3 promotes an infra-doc *convention* to frozen follow surface |
| S1–S11 | Eleven survivable warts (mirror-primary adoption gap, intern existence-oracle, empty-value foreclosure, 4th definition class, claimId non-injectivity × coordinate-REVOKE, occurrence-recipe vs typed lists, uint64 canonicality, SDK expiry-copy footgun, name/path duality, per-row matrix overrides, file-as-URL-prefix) | various | survivable | — |

---

## 2. Serious findings

### K1 — The appendOnly guarantee is hollowed by `expiresAt`. The collapse that silently dropped a write-time guard.

**The app:** *The County Recorder.* A land-title / notarized-filings registry publishes an appendOnly LIST per parcel: every deed transfer is an entry, the whole point being that **entries can never leave the record** — the same shape as the package registry's version ledger (infra §4.2), which is the ruling's own flagship reason for keeping LIST ("fold LIST_ENTRY into a plain cardinality-N edge and appendOnly enforcement dies with the declaration," ruling §2.3).

**What v1 actually guaranteed.** Two guards jointly made appendOnly entries *permanently current*: LE8 (`appendOnly ⇒ revoke REVERTs`, ListEntryResolver L303) **and** the total absence of any expiry field (negative census §1.9.1 — "reads filter on revocation, never expiry," seven rejection sites). An appendOnly entry, once written, could never leave any default read by any mechanism, including the author's.

**What the ruling ships.** Three ruled facts compose into a hole:

1. §4.1: "list-membership edges inherit the [expiresAt] word" — entry edges carry `expiresAt`. There is no rule forbidding a nonzero value on an appendOnly definition. ("Archive-shaped data … simply never sets it" is normative-by-hope, not a check.)
2. Maximalist C1, adopted by the §2.3 re-homing map: in-place supersession at the entry slot stays legal on appendOnly lists ("weight updates remain allowed … membership is what's append-only"). LE8's re-homed form rejects **REVOKE** only.
3. §4.1 read rule: "expired ⇒ resolve as STALE/unknown-currency and STOP"; §6: "Expiry … is currency grading on **R/C** claims" — class C explicitly gets the expiry word.

**The attack, both directions:**

- **Born-expiring:** a client (malicious, or merely one that defaults `expiresAt` on every claim "for freshness hygiene") signs an appendOnly guest-book/ledger entry with `expiresAt = now + 90d`. The signer believes appendOnly means permanent — and the record IS permanent — but past T it is served STALE by every compliant default read. The third-party promise appendOnly makes ("this ledger only grows and stays readable") now has an author-controlled currency knob v1 structurally lacked.
- **Retroactive staling (the compromised-key version — this is the left-pad scenario the ledger exists for):** a compromised publisher key cannot REVOKE the old version-ledger entries (class C refuses). But it CAN **supersede each entry slot in place** — same `(listId, target)` slot, higher seq, `expiresAt = now`. Every historical entry flips to STALE in one envelope. The ruling's own defense of the merge — "the second ledger entry has a different target/slot and the ledger-vs-slot divergence stays machine-detectable" (§2.3) — assumed the OLD entries stay current-visible; after this attack, divergence detection requires reading superseded records (archaeology), not `getSlot` (the one-read detection layer 2 was sold as). The registry's layer-2 defense degrades exactly when it matters (key compromise).

**Why this also triggers the ruling's own escape clause.** Residual #3 accepted the signer-legibility trade "on absence-of-app-evidence … if Phase-0's clear-signing review finds a concrete harm scenario, the fallback is a distinct kindTag alias." K1 **is** the concrete harm scenario, found by composing two rulings (§4.1 × §2.3) that were each individually sound. At minimum it re-opens residual #3's fallback question; at maximum it just needs the fix below.

**Fixes, priced:**

| Fix | Mechanism | Cost | Residual |
|---|---|---|---|
| **F1 (recommended)** | Edge module: definition is appendOnly LIST ⇒ `require(expiresAt == 0)` on entry ASSERTs (first and superseding) | one require + one golden vector | weight-reorder supersession stays legal (v1 parity); permanence promise restored |
| F2 | Forbid ALL supersession on appendOnly entries | kills reorder — regression vs v1 (order-property supersession was legal) | too blunt |
| F3 | Expiry monotone rules (can only extend, never shorten) | complex, still allows born-expiring | no |

F1 is one line and it is the difference between "the LIST node was kept for a reason" and "the LIST node was kept for a reason that no longer holds." **Freeze-blocking.**

### K2 — The ruling applies its replication-coherence principle to one REVERT and not the others. The survivors poison envelopes and enable chain-selective writes.

**The ruling's own principle** (§2.3 disposal 1, used to kill the `DuplicateIdentity` REVERT): "the conservative's REVERT is hostile to permissionless carriage — replaying a member's edges onto another chain must converge, not revert." Correct. Now inventory the admission REVERTs the ruled design *keeps* inside the same edge module, under whole-envelope atomicity (conservative §5.1.5, inherited):

| Surviving REVERT | Trigger | Order/state-dependent? | Permanent? |
|---|---|---|---|
| appendOnly revoke-second (§6 class C) | REVOKE admitted after its entry on a chain | **yes** — same record pair admits (tombstone-first→void) or reverts (entry-first) depending on relay order | **yes** — the revoke's envelope is inadmissible forever on any chain where the entry landed first |
| ListFull (LE6 re-homed) | per-(listId, author) counter at cap | **yes** — see the decrement question below | while count high |
| list targetKind mismatch (LE4 re-homed) | member kind ≠ charter kind | no (pure function of record + immutable charter) | fine — deterministic everywhere, not a K2 member; listed for completeness |
| OPAQUE negative-existence (IF conservative PI4 ships — see K5) | target happens to be registered on this chain | **yes** — varies by chain and by time | **yes**, third-party-triggerable |

**Flow 1 — the two-phone notary (honest multi-device, no attacker):** device 1 signs envelope E1 adding an entry to a non-synced list the user forgot is appendOnly; device 2, unsynced, signs E2 = [a day's records… , REVOKE of that entry]. Both are validly signed and floating under permissionless relay. On every chain where E1 landed first, **E2 reverts forever** — including all of E2's unrelated records, which can now only land via record-by-record `submitOne` cherry-picking (and the REVOKE leaf itself can never land). On chains where E2 landed first, both admit (tombstone written, then voided). Result: the author's *admitted log* permanently differs per chain, and naive full-log replay tooling ("copy the author to the new L3") wedges at E2. The ruling's mandated SDK charter-rendering (residual #3 mitigation) reduces the frequency but cannot eliminate it — permissionless signing means non-compliant clients exist by assumption.

**Flow 2 — deliberately chain-selective envelopes (the mission-property attack):** the mission sells "write once, anyone copies to any chain, no trusted copier." An author who *wants* chain-divergent state signs [filler records…, REVOKE-of-own-appendOnly-entry]: this envelope is structurally inadmissible on the home chain (entry present ⇒ revert) but admits cleanly on any fresh chain (tombstone-first, voided later or never). The author now has records that provably exist on replicas and provably *cannot* be admitted at home — a signed artifact whose visibility is chain-shaped by construction. Nothing catastrophic reads off it directly, but "the admitted set converges wherever carriage happens" — the property §5.3 calls invariant #1 — is false as ruled, and it is false via a lever the author controls.

**Flow 3 — the maxEntries counter is not a pure function of the admitted set.** LE6 re-homed: counter "incremented on new-slot admission only." The ruling never says whether REVOKE decrements (v1 did: swap-and-pop + count decrement). Both answers lose something:
- **Decrement (v1 parity):** admission of the 101st distinct target depends on whether revokes were admitted *before* it — order-dependence. Home chain interleaved revoke/add history admits 150 lifetime targets under a 100 cap; an out-of-order replay (tombstone-first is legal!) or subset replay reverts. Invariant #1 ("identical state from any admission order of any envelope subset") is violated by a kept gate.
- **No decrement (monotone):** order-independent, but semantics silently change — a capped list can never be pruned-and-refilled; "full" is a lifetime state. Defensible, but it is a behavior change the ruling did not adjudicate or document (it adjudicated the dup-gate change explicitly; this one rode along silently).

**Fix, priced.** Adopt one rule and apply it uniformly: **a validly-signed, well-formed record is never permanently inadmissible; semantic refusals are inert-recorded no-ops (with refusal-coded events), never reverts.** Precedent already exists inside the ruling itself — the void-tombstone rule *is* admit-and-void. Concretely:
- appendOnly REVOKE arriving second: admit the record, write nothing, emit `RefusedAppendOnly` (mirror of the void-tombstone case; final state identical either order; envelopes never poison).
- ListFull: admit-and-void the entry (recorded, not indexed into the active set), event; OR drop maxEntries from the kernel entirely (it is already declared chain-local — i.e., already not a portable truth — which is most of the way to "advisory"); AND answer the decrement question explicitly (recommend monotone/no-decrement if kept, for purity).
- Keep REVERTs only for: malformed/non-canonical bodies, unknown kindTags, dependency-not-yet-present (retryable forced-completeness — this one is *good* and genuinely different: it becomes admissible once deps land, never permanently poisoned).
Trade: "my revoke silently did nothing" is a real legibility loss vs a revert — priced by the refusal event + the already-mandated SDK charter rendering. **Freeze-blocking**, because refusal semantics are Etched kernel behavior.

### K3 — LIST config equivocation: "first config governs forever" has no cross-chain meaning.

§7's LIST row: same `(author, salt)` + different config ⇒ "author-equivocation evidence: recorded, first config governs forever, never merged." Under permissionless relay, **"first" is per-chain arrival order** — the one thing §5.3 says state must never depend on. Flow: a buggy SDK (or a malicious author constructing plausible deniability) emits LIST(salt, appendOnly=true, …) in E10 and LIST(salt, appendOnly=false, …) in E11. Chain A receives E10 first: the listId is appendOnly there; entries can't be revoked; K2's revert applies. Chain B receives E11 first: same listId is revocable there. The **same listId is governed by different charters on different chains, permanently** — and every downstream enforcement decision (revoke refusal, expiry legality under K1's fix, cap) diverges with it. Third parties who "trusted the declaration" (the R4 rationale for keeping LIST!) trusted different declarations depending on where they read.

The conservative wrote LI5, the ruling carried it verbatim, and neither gave it a deterministic rule — this is the ruling's self-identified "only owned-kind equivocation surface" (§2.5 hands LIST the 'opposite duplicate policies' mantle) shipped without the convergence analysis that every other duplicate row got.

**Fixes, priced:**

| Fix | Rule | Convergent? | Cost |
|---|---|---|---|
| F1 | Governing config = lowest `(seq, idx, digest)` among *admitted* configs; a lower config arriving later re-governs **future admissions only** (no retroactive re-validation of admitted entries) | eventually, for future writes; admitted-entry sets may permanently differ per chain | one comparison; documents residual impurity |
| F2 | Equivocation freezes the list: second distinct config admitted ⇒ list closed to new entries everywhere both configs exist | converges to closed; punishes only the equivocator | harsher; state changes when evidence arrives |
| F3 (recommended framing regardless of F1/F2) | Declare ALL charter enforcement chain-local admission state (the reservation already says this for maxEntries); purity invariant #1 formally scoped to non-equivocating authors; equivocation evidence event + golden vectors mandatory | honest | documentation + vectors |

Any of these is fine; shipping **none** of them means the flagship "owned declaration third parties can rely on" is chain-relative in exactly the case (author misbehavior) it exists to make legible.

### K4 — `supersededBy` as cardinality-1 PIN cannot express document splits. A frozen row with the wrong arity.

**The app:** *The Standards Body* — an RFC-style archive (squarely archive-shaped, squarely in-mission). Real supersession is **many-to-many**: RFC 1521 is obsoleted by RFC 2045, 2046, 2047, 2048, AND 2049; monolithic specs split into parts; a charter splits into two governing docs (DAO app!); a playlist splits in two. The ruling froze `supersededBy` as PIN — "one successor per author; correct-by-re-pin" (§2.2) — on the evidence of apps 1/2/7, which happened to contain only linear version chains. An author of a split document physically cannot state its successors: the PIN slot holds one; re-pinning *replaces* the first part with the second. The only workarounds forfeit the row's semantics: `relatedVersion` TAGs are **never auto-followed** (frozen vectored policy — old links will not walk to the parts), and a successor-LIST is a heavyweight second spelling.

Same audit applied to the other card-1 rows: `symlink` PIN — correct (a path points one place per author); `movedTo` PIN — correct (rename is 1:1; a folder *split* is genuinely two moves of contents, not one movedTo); `mirrors` — already dual-role. **Only `supersededBy` fails the audit.**

**Fix, priced:** reuse the dual-role pattern the ruling itself invented for `mirrors` (§2.1): `supersededBy` = PIN (the primary/designated successor — keeps the O(1) "follow the chain" point read and re-pin correction) + TAG (additional successors, weight = ordering among parts), read rule "successor set = PIN ∪ active TAGs; PIN is the designated continuation." One row edit + vectors, free pre-freeze, an additive-role scar post-freeze. Note this makes dual-role a *pattern* (2 of 14 rows) rather than a one-off — the reserved-key table chapter should define it once.

### K5 — The legal targetKind set, and OPAQUE in particular, is unadjudicated — and the two candidate rules fail in opposite directions.

The ruling never states the closed targetKind enumeration (PI3's set appears nowhere in it; §5's rows imply ADDRESS and object kinds; App 5's collections used TARGETKIND_OPAQUE for foreign ids). Two source texts conflict:

- **deterministic-ids §PIN (frozen v1 math the ruling claims to port):** "TARGETKIND_OPAQUE ⇒ **no dependency**" — no check at all.
- **conservative PI4 (the census the ruling adopted as checklist):** "OPAQUE ⇒ targetId nonzero AND **not a registered object or claim id** of any canonical kind."

**Horn 1 — ship PI4's negative-existence check:** admission now depends on *foreign state that differs across chains and time*. The Collection Sniper: Carol's collection edge targets an as-yet-uninstantiated id X as OPAQUE (legal at home). An adversary watching for her envelopes instantiates X (a derivable tagId — TAGDEFs are unowned and permissionless!) on the destination L3 before her envelope is replayed ⇒ her envelope **perma-reverts there** (whole-envelope atomicity; a third party manufactured a K2-class poison). Worse: it's non-monotone on one chain — the same envelope admissible at T0 becomes inadmissible at T1 after someone registers X.

**Horn 2 — ship deterministic-ids' no-dependency rule:** an author can declare a *registered* DATA as OPAQUE. Since the PIN slot key is `(author, definitionId, targetKind)` — targetKind is IN the slot — the same logical placement spelled OPAQUE vs KIND_DATA occupies **two coexisting active slots**: two current claims for one fact, the exact dual-active-claims class §8's invariant ("anything that makes slot identity depend on data or state manufactures dual active claims") is supposed to kill. Contained in practice — typed readers derive with declared kinds and never see the OPAQUE spelling — but it is a standing "one fact, two spellings" exception to declared doctrine (§9.1).

**Adjudication owed, with my lean:** take Horn 2 (port the frozen math; no state-dependent negative checks — Horn 1 hands third parties an envelope-poisoning lever and breaks admission monotonicity, which is worse than a reader-invisible second spelling). Then: (a) Codex sentence: an OPAQUE spelling of a registered object is a *different predicate* by definition, never resolved by typed reads — with a golden vector; (b) OPAQUE forbidden as targetKind in every reserved-key row (all 14 rows are typed — make it explicit); (c) state the closed targetKind enumeration in the ruling's §1.2 where it belongs.

### K6 — The expiry no-fallthrough rule makes an expired claim MORE blocking than a revoked one. Unscoped, it is a lens-wedging lever.

§4.1: "expired ⇒ resolve as STALE/unknown-currency and STOP — never fall through to the next lens author." Compare the lifecycle outcomes: **revoked claim ⇒ slot empty ⇒ next lens author serves** (clean yield); **expired claim ⇒ STALE ⇒ full stop** (path wedged for every author below). Consequences:

- *The Bored Squatter / the abandoned co-author:* any author included in a lens above others (a wiki lens, a family archive lens, Carol's curation list) who once wrote placements with short `expiresAt` and walked away converts every such path into permanent STALE for all subscribers — content from perfectly good lower-lens authors is unreachable. The wedge requires prior lens inclusion (trusted-then-lazy, or trusted-then-hostile), which is exactly the "first compromised curator" persona consumer-FM8 already worries about — this hands that persona a *passive* wedge needing no key compromise, just expiry + absence.
- *Perverse incentive:* an author who wants to exit cleanly must REVOKE (yields); expiry — the mechanism sold for safety — punishes readers harder than retraction does. Authors learn to never set expiry on placements, which quietly defeats §4.1's purpose on the read paths where lenses matter.

The rationale (a freshness bound must not become a trust transfer) is *correct for safety-critical machine consumers* — a contract or an installer must absolutely stop. The ruling even writes "(safety-critical)" in the rule's title — but the rule text is unscoped and FM1-anti-fallthrough conformance tests will enforce it blanketly. **Fix:** split the frozen read rule by declared context: (a) machine/gating reads and `?current` views: STALE ⇒ stop, never fall through (as ruled); (b) interactive lens browsing: STALE ⇒ label-and-render-stale by default, fallthrough only by explicit reader policy, never silent. Plus one Codex sentence on the revoke-vs-expire asymmetry so SDK verbs steer exit flows to REVOKE. Vectors for both contexts. Without the split, either the wedge ships or clients ignore the rule ad hoc — both worse than deciding.

### K7 — `successor` as an active frozen row pre-KEL is a blessed key-theft migration path.

§4.3 promotes the infra doc's *convention sketch* (F2.3's "fix is convention") into a frozen reserved row: `successor` (PIN, REF targetKind=ADDRESS, ADDRESS-container parent, "consumer convention 4.4"). But v2 identity is bare-EOA with **no KEL, no pre-rotation, no revocation of identity** — precisely the machinery that makes succession claims safe, and precisely what the substrate decision reserved rather than built (arch-B red-team: KEL truncation-replay was a named lesson). As ruled: **whoever holds the key can PIN `successor` = attacker's address on the victim's own container** — the thief performs the very succession ceremony consumers are being taught to read, and re-pins it ahead of any competing claim (card-1 slot, the *current* holder always wins the slot). A frozen row + a Codex consumer convention = ecosystem-wide auto-migration of trust to the thief. The DAO app that motivated the row is the persona *most* exposed (high-value org keys).

Two defensible fixes: (a) **demote to reserved-not-active** — freeze the row's format and vectors alongside the KEL reservation (they are the same subsystem; succession semantics should ship when the KEL does, with pre-rotation binding); or (b) keep the row but the Codex text is mandatory and hostile: *advisory forwarding hint only; MUST NOT be consumed for authorization or authorship migration; consumers key authorship on the original word until KEL machinery exists.* (a) is cleaner — a row that must not be believed is worse than no row. `home` (same §4.3) is genuinely advisory (a lying `home` misdirects a freshness check, degrading to "unknown," fail-safe) and can stay.

---

## 3. Survivable findings (named so they land in vectors/Codex, not folklore)

- **S1 — mirror-primary adoption gap.** The repaired O(1) mirror point read (§2.1) only exists for authors who write the PIN. App 4's persona (2–3 co-equal mirrors, no primary) writes TAG-only; `tokenURI`-class consumers read an empty PIN slot and get nothing despite live mirrors. Fix is SDK+Codex: the add-first-mirror verb writes the PIN by default; consumers' documented fallback is "PIN empty ⇒ enumerate TAGs (off-chain) or fail." Without the default, demand #4's repair silently under-delivers.
- **S2 — auto-intern is a global existence oracle, and mirrors/names now feed it.** VAL admission interns value bytes as permanent unowned objects with derivable ids. New vs v1: *mirror URIs* (presigned URLs, onion addresses, `data:` payloads) and `name` values are interned — anyone can probe `getObject(H(DOMAIN_PROPERTY, tag, keccak(bytes)))` to test whether *anyone ever* used an exact URI/name/value, no scan needed. Also: salted-TAGDEF privacy users who bind a plaintext `name` VAL have re-leaked the name globally. One Codex privacy paragraph (salted-path users must skip/encrypt `name`; high-entropy values are safe by construction) — the ruling priced storage of interning but not the oracle.
- **S3 — the empty value is foreclosed by admission (`value.length ∈ (0, 8192]`) while `propertyId(H(""))` remains derivable in the frozen formula.** v1 PROPERTY allowed `""`. Unmintable-but-derivable ids are a small standing spec asymmetry; either allow empty (drop the lower bound for non-reserved keys) or vector the exclusion. Cosmetic-plus.
- **S4 — the definition-class enumeration is incomplete.** Edge admission dispatches on definitionId ∈ {instantiated TAGDEF, virtual reserved key, LIST, …and the spec-vocabulary visibility constants} (R2 grounds: "uninstantiated virtual keys," folder-visibility defs). The fourth class appears in the refusal of R2 but never in the ruling's edge-module spec. One table.
- **S5 — claimId is non-injective under the admit-both seq-collision rule.** If two same-`(author, seq)` different-digest envelopes both admit (conservative §5.2, deferred to the envelope red-team), `claimId = H(author, seq, idx)` names **two records**, and a coordinates-REVOKE tombstones both; `getClaim` is ambiguous. Already queued to the envelope pass — but the coordinate-REVOKE cross-effect and a duplicate-matrix vector for it must be on that pass's list explicitly (the ruling's §7 envelope row doesn't mention REVOKE).
- **S6 — the opaque-occurrence recipe is incompatible with typed lists.** `target = H(member, occurrence)` fails `targetKind` validation on any KIND_DATA-typed list (the hash isn't a registered DATA) — so the `allowsDuplicates` escape hatch only serves ANY-typed lists, and it hides the member's identity from typed readers. The §2.3 flip condition ("a real app … rejects the opaque-key recipe") is structurally nearer than the ruling implies: any duplicates-with-typing app (playlist with repeated tracks + per-occurrence metadata + typed membership) rejects it by construction. No change now; re-state the flip condition honestly.
- **S7 — `expiresAt` needs a canonical-word check** (uint64 in a 32-byte word, high bytes zero) or the fixed-length canonicality guard admits 2^192 encodings of each expiry. One require; add to the body-shape vectors.
- **S8 — SDK reorder/refresh must copy `expiresAt` forward.** In-place supersession (weight reorder, mirror re-assert) re-signs the whole body; a client that zeroes or defaults expiresAt on reorder silently clears/extends a safety bound. SDK verb rule + one vector.
- **S9 — two ways to name a file** (path TAGDEF naming slot vs the `name` reserved VAL row). Both legitimate (path vs display name) but the Codex must say which one file-listing UIs prefer, or ecosystems fork on it. One sentence.
- **S10 — reserved REF rows override the edge attachment matrix per-row.** `sameAs`/`supersededBy`/`symlink`/`movedTo`/`successor` bind REF targets under keys derived with the KIND_PROPERTY word — violating PI5's "KIND_PROPERTY def ⇒ KIND_PROPERTY target" unless each row carries an explicit matrix exception. The §5 table implies but never states the override column; 14 rows × unstated exceptions = the forSchema-class gap. Add a "matrix override" column to the frozen table.
- **S11 — file-URLs become container prefixes** under the §4.2 relaxation: `alice.eth/statement.pdf/UPDATED-statement.pdf` is now a resolvable path shape (unowned child TAGDEFs + any lens that includes the hostile author). The mandated precedence chapter handles the shadowing; add one hostile-child vector and one UI note (path segments below a file node are not the file author's content) so the phishing shape is priced.

---

## 4. Attacks attempted that failed (do not re-walk)

- **PIN/TAG merge (trap #1) and DATA/TAGDEF merge (trap #2):** attacked via the ruling's own new surfaces (VAL layouts, dual-role rows) — no new breach; the slot-identity invariant (§8) held everywhere I pushed except the OPAQUE horn already reported as K5.
- **VAL-typed lists** (LIST with targetKind=KIND_PROPERTY, membership = VAL-TAGs interning values — a controlled-vocabulary/blocklist app): works by construction; the biconditional + slot-on-derived-propertyId compose correctly. Genuinely elegant.
- **Mirror dual-role split-brain** (same URI as PIN and TAG; PIN revoked with TAGs live; primary≠member of TAG set): the union read rule disposes of all orderings I constructed; only the adoption-gap (S1) survives.
- **Auto-intern race/griefing:** first-writer interning is idempotent and unowned; front-running an intern is a gift (v1 property posture, unchanged).
- **Virtual reserved-key instantiation** (someone registers the `mirrors` KIND_PROPERTY TAGDEF for real): late instantiation is the already-specced idempotent branch (deterministic-ids §5); recompute-and-compare is indifferent. Harmless.
- **Cherry-picked VAL self-containment:** holds — VAL edges carry their value; the forced-completeness REVERT on missing defParentId is the good (retryable) revert class.
- **Naming-vs-categorizing destructive collision:** none found beyond the already-flagged cross-kind shadowing (§2.7) and S9/S11; kind-in-the-id keeps `/pizza`-folder and `#pizza`-label coherent under every flow I built.
- **Comment/defensive-inclusion races under §4.2 relaxation:** idempotent TAGDEF duplicates keep them harmless, including under a file node.
- **String-only + 8192 cap:** hunted for a breaking consumer among the invented apps (vault keyWraps, deprecation messages, review bodies, RFC metadata) — none; bodies >8KB correctly become DATA+mirror. The ruling's marketplace re-check trigger stands as stated.

---

## 5. The 2076 regret, ranked

1. **The LIST_ENTRY→TAG bimodality — but only if K1/K2 ship unfixed.** As ruled, a 2076 maintainer reading a bare TAG record cannot know its revocability class, expiry legality, or cap exposure without a registry read, and the permanence promise that state-dependence guards has an expiry-shaped hole (K1) and chain-shaped admission (K2/K3). With the K1 require + K2's inert-refusal rule + K3's convergence rule, the merge is defensible and the write-count wins are real. The distinct-kindTag-alias fallback (residual #3) remains the right insurance policy to keep priced.
2. **The 14-row reserved-key table** — the ruling already names it (#2), and it is already growing (12 rows in the maximalist draft → 14 at ruling, +2 in one reconciliation pass, and K4 wants a row edited). The growth *rate* is the regret signal: every future pass will find one more row, and each is Etched. The mitigation that matters is not per-row vectors (necessary, insufficient) but a hard rule for what may NEVER become a row (my proposal: nothing that is an authorization surface — K7 is the first violation) and the dual-role pattern defined once, not per-row.
3. **The VAL/REF fork under one kindTag** — correctly self-identified as risk #1; nothing new found beyond the mandated fuzz, which is the right mitigation.

## 6. Verdict

**The 5-kind ruling stands: no collapse must be undone, both traps hold, and the app evidence was read fairly.** But it is not signable as written. K1 voids the stated premise for keeping LIST (appendOnly's permanence promise is hollowed by the expiry word the same ruling introduced); K2 shows its replication-coherence principle was applied to the one REVERT it wanted to delete and waived for three it kept — with envelope-poisoning and deliberately chain-selective writes as the price; K3 leaves the ruling's own "only owned-kind equivocation surface" without a convergence rule. All three are one-require/one-rule fixes pre-freeze and successor-domain pain after. K4–K7 are frozen-surface errors of arity, adjudication, scoping, and overreach respectively — each a small edit now, a scar later. The survivable list belongs in vectors and Codex sentences, not in anyone's memory.
