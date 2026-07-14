# Red-team attack report — EFS v2 identity design (identity.md)

**Role:** Red team (v2 tag-core pass, 2026-07-07)
**Target:** `scratchpad/efsv2/identity.md` (bare-EOA now, KEL reserved, in-place succession)
**Method:** full read of the target + ground truth (carrier decision, record-format investigation, substrate decision, arch-B + its red-team lessons, research-identity-crux, deterministic-ids Codex, tag-core handoff); independent recomputation of every byte-exact claim; then adversarial attack on the six assigned surfaces.

**Verdict up front: NO FATAL FLAW.** The bare-EOA-first + frozen-reservation + in-place-succession architecture survives. I tried to kill it at the ruling level (in-place vs new-identity, peer-deployment, PQ deadline, reservation additivity) and could not — every systemic weakness I found is either (a) the identity-layer instance of a limit James has already ruled acceptable for revocation, or (b) fixable inside the design with doc text, one kernel rejection rule, one frozen read rule, and two handoff lines. But the design has **10 serious findings** that must land before this is freeze-grade, including one genuine convention bug (B2), one hole in the "frozen" union-read rules (D2), one silently-levied kernel requirement that contradicts the "zero machinery" claim (E1/E2), and a PQ deadline that is understated as written (F1).

---

## 0. Verification of byte-exact claims — ALL PASS (do not re-litigate these)

Independently recomputed with `cast` (foundry) + python:

| Claim | Result |
|---|---|
| All 12 keccak preimage constants (§1.1, §1.2, §2.1, §2.2, §2.4 incl. `efs.system.v1`) | **exact match** |
| `domainSeparator` = keccak(abi.encode(keccak("EIP712Domain(string name,string version,bytes32 salt)"), keccak("EFS"), keccak("1"), salt)) | **exact match** `0x2f735cac…fcc50` |
| V-EOA-1 `eip712Digest` (typeHash → structHash → 0x1901‖DS‖SH) | **exact match** `0x5cab11d5…98ee` |
| V-EOA-1 signature | **byte-identical reproduction** via `cast wallet sign --no-hash` with hardhat key #0; v=28, recovered = author ✅ |
| V-TID-1 seq `0x195838c12b00002a` | decodes to 2026-07-08T00:00:00.000000Z, deviceBits 0x02a, bit63 = 0 ✅; 53-bit µs field ≈ 285 yr (exhausts ~2255-06-05) |
| V-KEL-1 keyHash / bodyHash / inceptDigest / identityWord (incl. keysDigest = keccak(abi.encode(bytes32[],bytes32[])), authorField=0, evType/evSeq as uint256) | **exact match**, top 96 bits of identityWord nonzero ✅ |
| V-KEL-2 bodyHash / inceptDigest (boundAddress = authorWord) | **exact match** |
| ID-SHAPE-1 math: honest re-salt p = 2^-96; specific-EOA impersonation = 2^160 preimage; control-both-sides joint birthday ≈ 2^128 (M·2^96 grinding vs N key-gens balancing at M≈2^32, N≈2^128) | **checks out**; and the rule genuinely converts shape from probabilistic to invariant |

Also verified as internally consistent: low-S + v∈{27,28} canonicalization (the PLC lesson is actually applied); monotone `[add, remove)` key windows (anti-Farcaster rule present); reserved-word rejection is redundant in v2 (keccak("efs.system.v1") is digest-shaped, already rejected by shape) but correctly meaningful post-KEL to forbid inception of the system word. The FM register (§7) is unusually complete for a first pass. Credit where due: this is the strongest-vectored identity doc in the corpus.

---

## 1. Attack surface A — key-loss consequence table (§3.1): four missing consequences

The table is good but **not complete**. Missed rows, in descending severity:

### A1 — SERIOUS: LOSS row omits the KEL-lockout death sentence
§2.1 (signing rules): an in-place INCEPT (`boundAddress != 0`) **MUST carry a secp256k1 signature by that address**. Therefore a LOST key can never incept a KEL — ever. Combined with §5.4, LOSS today is not "no future writes"; it is a **scheduled full identity death at E(secp256k1)** with no migration path, decided the moment the key is lost, years before the user experiences it. The table's LOSS column reads as "namespace freezes, archive survives" — true at year-0, but the row "eligibility for the entire future succession machinery: **forfeited permanently**" is absent. Users deciding custody posture in 2027 need this row more than any other.
- **Fix exists inside design:** yes — pure documentation. Add the row; cross-ref §5.4. (Nothing in the machinery can fix it: an unsigned inception would be a master key.)

### A2 — SERIOUS: THEFT row omits the KEL-launch escalation, and understates it
FM-2 names the thief-inception race, but the user-facing table (§3.1, which §8.4 says goes in docs "nearly verbatim") does not. Worse, FM-2 itself understates the blast: when the thief incepts first and pre-rotates to thief keys, §4.2 rule 2 then **demotes the victim's own subsequent bare-key writes to `unauthenticated-post-inception` and excludes them from slot supersession** — the protocol machinery actively silences the victim on every chain the thief's inception reaches. Undetected theft in 2027 converts to *permanent, protocol-assisted* capture at KEL launch. "Wait for the KEL to fix my stolen key" is the natural user belief and it is exactly backwards.
- **Fix exists inside design:** partially. Add the row; strengthen FM-2 text; the real mitigation (PLC-style challenge window in `metaHash`) is correctly deferred to KEL build. Launch-comms item stands.

### A3 — SERIOUS (conditional on the encryption conventions): the encrypted-content row is missing entirely
The identity doc never mentions encryption, but the v2 bundle carries encrypted-file conventions (holistic §2.3; `contentEncryption`/`keyWrap` reserved keys in deterministic-ids §5). If content keys are wrapped to the identity key (the default wallet-ECIES pattern every SDK reaches for):
- **THEFT ⇒ retroactive confidentiality loss** — the thief decrypts the victim's entire encrypted archive. This is the *only* consequence in the whole system that is retroactive/non-monotone, and it's absent from a table whose claim is completeness.
- **LOSS ⇒ the author loses access to their own data** — the only consequence class where LOSS destroys data access, not merely authorship. "History survives, links survive" is false for the author's own encrypted files.
- **Fix exists inside design:** yes. Add the row; either (i) state that key-wrap targets are independent of the identity key (and make that SDK-normative), or (ii) admit the coupling. Decide which — silence is the bug.

### A4 — SURVIVABLE: expiry backfires under LOSS
Author-set EXPIRY is cited as a LOSS mitigation (for un-revocable mistakes). Its cost is uncounted: safety-critical data with expiry **self-destructs on schedule and the lost key can never refresh it**. For an archive persona this converts LOSS from "nothing rots" to "everything safety-graded rots on a timer." One cell.

### A5 — SURVIVABLE: no org-variant of the table
Org cold-key LOSS freezes the member lens list forever (no personnel changes, ever); §3.3 gestures at it ("the only un-rotatable atom") but the consequence table doesn't have an org column. One paragraph.

---

## 2. Attack surface B — the successor convention (§3.2): one real bug, one inverted heuristic

### B1 — SERIOUS: the "strongest available" grade is forgeable by any quiet thief, and the earliest-anchored heuristic then works FOR the thief
The grading table's top grade is "published proactively while K1 is presumed uncompromised." Presumption is social. A competent thief's **first act** is to sign a successor pair to thief-controlled K2′ and anchor it *before* revealing themselves. At adjudication time: the thief's pair is anchored EARLIER than the victim's post-discovery genuine pair, from an identity that was "presumed uncompromised" at anchor time. Every intuitive heuristic ("earlier = stronger", "pre-dates the incident") now points at the thief. The table's own grading language will actively mislead adjudicators in exactly the case it exists for.
- **Failure scenario:** key stolen 2027-03; thief anchors successor pair 2027-03 (quiet); victim notices 2027-06, anchors genuine pair; lens curators consult §3.2's table, read "anchored at block N before compromise was socially dated" as the strongest grade, and migrate subscribers to the thief.
- **Fix exists inside design:** yes, three doctrine lines: (i) SDK-normative recommendation to publish a successor pair (to a cold successor key) **at identity creation** — then any later thief pair is a visible slot supersession with an evidence trail, not a first claim; (ii) adjudication guidance: a *first-ever* successor pair from a long-dormant identity followed by prompt migration pressure is the thief signature, not the strong grade; (iii) add the "pair published by undetected thief, pre-dating discovery" row to the grading table explicitly. Never-auto-follow already caps the damage; this fixes the human layer the doc explicitly routes adjudication to.

### B2 — SERIOUS: the PIN slot key breaks the convention's cardinality-1 claim across targetKinds
Frozen slot table (deterministic-ids §1): PIN slot = `(attester, definitionId, targetKind)` — **targetKind is in the slot key**. The convention says the successor PIN uses `TARGETKIND_ADDRESS` now, `TARGETKIND_OPAQUE` "once digest-shaped words exist." Those are **two different slots**. Consequence: K1 can have two simultaneously-"current" successor pointers (one ADDRESS, one OPAQUE) with **no supersession between them** — the thief doesn't even need to overwrite the victim's proactive claim; they park their K2′ in the other slot and both read as live. The doc's "cardinality-1 PIN" claim is false at the one place cardinality-1 is load-bearing. Ironically, deterministic-ids §Open-questions rejected hook-time targetKind inference *precisely because* "re-classification creates two active PINs at one logical placement" — the successor convention reintroduces that exact hazard by legitimate means.
- **Fix exists inside design:** yes, two options, both frozen-doctrine text: (a) pin the convention to **one targetKind forever** — TARGETKIND_OPAQUE, encoding address-shaped successor words as opaque bytes32 (they are just words; OPAQUE has no validation dependency), so exactly one slot exists; or (b) a frozen read rule: readers MUST union the successor slots across targetKinds and grade >1 live pointer as `contested`. (a) is cleaner; take it.

### B3 — SURVIVABLE: the authoritative-attester read rule is implied, never stated
The only authoritative successor claim for word W is the PIN whose **attester == W** (slot derivation includes attester, so anyone can hold a PIN at the same definitionId under their own attester word). A UI that renders "successor claim exists at W/…/successor" without checking signer == W is trivially hijackable. One normative sentence: *a successor claim for W is valid only if recovered author == W; the mirror only if recovered author == K2.*

### B4 — SURVIVABLE: the tag name is unfrozen and miscounted
`efs.identity/successor` is two path segments under tag-core (TAGDEF per segment) — so the convention is 2 TAGDEFs + 1 PIN = **3 writes, not 2** (unless `/` is meant literally inside one segment name, which the canonical-name profile likely forbids or percent-encodes — unstated). Also: tags are unowned, so homoglyph/sibling names (`efs.identity/succesor`) can phish UIs that match by display string. Fix: freeze the exact segment names, compute and publish the derived tagId constants as Codex vectors (V-SUC-1 should carry them), and require UIs to match by tagId, never by string.

### B5 — SURVIVABLE: unstated dependency — TAGDEF under address containers
The convention assumes address containers are legal TAGDEF parents (the deterministic-ids §5 clause-(c) exemption ported to tag-core). Probably true; not stated anywhere in the tag-core ruling. Add to §8 handoff for the tag-core designer.

---

## 3. Attack surface C — org/Safe story realism (§3.3)

### C1 — SERIOUS: the precedent analogy is inverted, and DAO-native orgs are locked out of authorship in a way FM-12 doesn't cover
"Debian, TUF roots, PGP-signed release chains have operated for decades" — **all three carry exactly the machinery v2 lacks**: TUF's entire design is m-of-n threshold root *rotation* with expiry; Debian archive keys rotate per release and expire; PGP has revocation certificates (offline pre-generated — the analog of pre-rotation). The decades of practice being invoked exist *because of* rotation/threshold/expiry, not despite their absence. The analogy as written overstates the doctrine's safety.
Separately and worse: **single-sig authorship (ruled freeze-grade in §2.1) + no KEL in v2 = no m-of-n content control exists at all at year-0.** §3.3 says orgs "get it via KEL thresholds on rotation plus internal process" — the KEL doesn't exist yet; in v2 the offer to a Safe-governed DAO is "hand one member (or one HSM custodian) unilateral publishing power." That is a governance regression for exactly the multisig-native institutions named as the year-0 population, and it is distinct from FM-12 (rotation-compliance lockout): call it **threshold-authorship lockout**. A DAO that constitutionally cannot vest unilateral authority cannot author, full stop, until the KEL ships.
- **Fix exists inside design:** partially. No machinery fix without violating the single-sig ruling (which is correctly defended — thresholds in the hot path would be worse). Fixes: (i) rewrite the analogy honestly (cite PGP *offline revocation certs* as the true analog of what v2 lacks); (ii) name threshold-authorship lockout as a residual next to FM-12; (iii) doctrine for DAOs: per-era key + **proactive successor pair signed at key creation** + org lens = the honest v2 floor; (iv) count DAOs toward the substrate experiment-(c) pull-forward trigger.

### C2 — SURVIVABLE (but name it): the cold key can't stay cold under churn
Every personnel change = one cold-key write. "Used rarely enough for ceremony-grade custody" is false for any org with monthly contractor churn; the predictable drift is cold → warm → hot → FM-4. In-design mitigation exists with zero new machinery: **two-tier lens indirection** — the cold key writes once to bless a steward word; the steward's own lens list carries members; viewers subscribe to the org lens which chains through. Cost: steward capture ≈ hosted-signer risk, bounded by the cold key's ability to re-point. Document the pattern and the churn threshold at which it's mandatory.

### C3 — SURVIVABLE: "smaller consequences than any prior system of this class" overclaims
ATProto with hosted PDS + email-recoverable rotation keys has *strictly smaller* user-visible key-loss consequences (near zero). The sentence is defensible only scoped to **self-custody signature-root systems** (vs Nostr/SSB/bare PGP — there it's true). Scope the claim; it's the honest sales contract, so it must not be beatable by a Bluesky comparison.

---

## 4. Attack surface D — the in-place ruling (§4.1): the trap exists, is real, and is survivable — but it must be named as a failure mode

I attacked the ruling itself first: option N (new digest identity + successor pair) re-runs the §3.2 social-migration pain per author forever, punishes year-0 adopters permanently, and relocates (not removes) the theft race — the adjudication FOR U is sound and I could not overturn it. The trap is in what U costs and where the doc soft-pedals it:

### D1 — SERIOUS: post-KEL, rotation is fail-open and chain-local forever; the doc grades it but never names it
Under U, "address-shaped" keeps the bare rule as fallback everywhere the inception isn't anchored. Consequences the doc distributes across three sections but never assembles:
1. The demoted old bare key remains a **fully valid author on every chain that hasn't seen the inception** — including every chain *born after* the rotation. Rotating away from a compromised key is only effective per-chain; the author (or anyone) must LOCKSS-replicate the inception to every chain that matters, forever. Rotation is advisory, not revocation.
2. **On-chain composability consumers cannot apply read grades.** Etched year-0 kernels keep admitting bare envelopes and updating their slot state; a contract wired to `getSlot` on an old kernel is a bare-rule consumer for eternity. §4.2's "contracts name their stores explicitly" quietly means "year-0 contracts are un-upgradeable to KEL semantics."
Under N, digest-shaped words fail closed on KEL-ignorant chains — this is the one real security property U trades away, and the trade table's "epistemics" row understates it as a grading issue when it is also a *live slot-state control* issue.
- **Is it fatal?** No — it is byte-for-byte the same class as the accepted withheld-REVOKE ruling (home chain certain, elsewhere best-effort, graded), and the mission already priced that. But it is not currently in the FM register, and it's bigger than several things that are.
- **Fix exists inside design:** yes. (i) New FM row: "**FM-14 rotation-locality**: post-KEL, key removal/rotation binds only chains carrying the KEL; the bare key remains authoritative for admission and slot state elsewhere; mitigation = permissionless inception replication + read grading; safety-critical on-chain consumers treat address-shaped authors at bare-EOA grade." (ii) Doctrine: inception replication is part of the LOCKSS act (copy the KEL with the data). (iii) The Codex sentence: *in-place upgrade chose continuity over containment; containment is per-chain.*

### D2 — SERIOUS: divergent inceptions across chains — the frozen union-read rules have a hole exactly where FM-2 lands
Per-chain the kernel enforces one KEL per word. Nothing prevents **two different valid INCEPTs for the same address word on two different chains** (the FM-2 race run in parallel: victim incepts on chain A, thief on chain B — both carry valid boundAddress signatures). §4.2's frozen union rules cover record supersession and single-inception demotion; they define **no rule for a KEL fork across stores**. A reader unioning A and B has two heads, two key states, and no frozen vocabulary for it — "valid-as-of(head)" assumes one head. This is the one place the design's own named race produces a state its "frozen" read rules can't read.
- **Fix exists inside design:** yes, and it's freezable NOW as read-layer text (same class as the §1.3 record tie-break): *divergent inceptions (or divergent KEL events at one evSeq) for one word across accepted stores ⇒ identity state reads `contested`; envelopes verifying only under one fork's key state are excluded from slot supersession and graded `contested`; pre-fork state (bare-rule admissions before the earliest inception on each chain) is unaffected; adjudication is social/lens, exactly like record equivocation.* Without this rule, the KEL build inherits an undefined merge; with it, FM-2's worst case has deterministic, honest semantics.

### D3 — SURVIVABLE: the "same statement as revocation" equivalence is rhetorically overclaimed
Withheld-REVOKE has per-record blast radius and a real author-side mitigation (expiry). Withheld-KEL has **per-identity** blast radius (every record by that author re-grades) and expiry does not port ("was this key valid" is not a data-currency question — expiry doesn't help against a stolen signer even on the home chain). The *vocabulary* inheritance is fine and the conclusion stands; the claim "it is the same statement" should be weakened to "it is the same grade structure with a larger blast radius" so the ruling isn't defended by a false symmetry.

---

## 5. Attack surface E — is the reservation genuinely additive? Mostly yes; two levied requirements are unstated and one posture change is smuggled

### E1 — SERIOUS: reserved kinds must be admission-rejected in v2, and the doc doesn't say so
§1.1 rejects reserved *author* shapes/words. Nothing rejects reserved **kind tags**. If the v2 kernel admits records under unknown/reserved kindTags as opaque bodies (the envelope designer could reasonably build it that way), anyone can write KIND_KEL / KIND_ANCHORSET records for four years before the KEL ships — polluting the exact record-stream namespace the reservation exists to keep clean, and manufacturing "was this a valid pre-launch INCEPT?" ambiguity at KEL build time. The reservation is only additive if the reserved namespace is *empty* when un-reserved.
- **Fix exists inside design:** trivially — one admission rule mirroring `ReservedAuthorShape`: records with kindTag ∈ {KIND_KEL, KIND_ANCHORSET} (and any future reserved-tag set, frozen as a closed list) reject with `ReservedKindTag`. Add to §1.2 and the §8.1 handoff.

### E2 — SERIOUS: the "frozen read-layer, zero machinery" union rules silently levy two v2 kernel state requirements
Rule 2 (inception demotion) compares by **admission block order** — so per-envelope admission ordering must be a reconstructible state fact (state-walk, not just events, per the EIP-4444 doctrine). The demotion's "excluded from slot supersession" is computed reader-side against an Etched kernel whose own slot state can't change — so readers must be able to enumerate **full per-slot claim history** from state, not just the current winner. If the envelope/kernel designer ships winner-pointer-only slots or event-only admission ordering, §4.2 becomes uncashable in 2030 and the reservation's load-bearing rule dies. Neither requirement appears in the §8 handoff.
- **Fix exists inside design:** yes — two lines in §8.1: (i) admission order per (author,seq) must be state-walk-reconstructible; (ii) superseded claims must remain state-enumerable per slot. (Arch-B's AdmissionLog + claim store likely satisfy both — but "likely" is exactly what handoffs exist to remove.)

### E3 — SURVIVABLE (but James must ratify consciously): §5.4 amends the substrate decision's posture
Substrate §8: KEL machinery is a **demand-triggered hedge** (experiment (c): no institution ⇒ "the portable layer stays a hedge, which the reservations fully fund"). Identity §5.4: the KEL is a **dated obligation (~2030) regardless of demand**, because without it every v2 identity dies at E. The PQ logic is sound and the honesty is admirable — but this is a real amendment to a settled decision rule (hedge → scheduled commitment), presented inside a PQ section rather than as the governance change it is. It doesn't force v2 machinery, so the reservation stays machinery-additive; it does force a future build. Surface it as a named amendment in the transition plan, per §8.3 — and let James accept it with eyes open rather than discover it later.

### E4 — SURVIVABLE: "no schedule risk beyond the already-budgeted envelope review" is optimistic
The reserved KEL formats + WebAuthn profile + algoTag registry are a materially bigger review surface than the envelope alone, and *reserved* formats historically get shallow review precisely because they're not live — which is how forSchema propagated. The v1-suffix escape hatch (§2 preamble) is real and makes this survivable, but the external-review scope should name the reserved chapters as first-class review objects with their own sign-off, not riders.

---

## 6. Attack surface F — PQ honesty: honest in structure, understated in one load-bearing place

### F1 — SERIOUS: the §5.4 deadline is a conjunction, and the doc states only one conjunct
"Every live bare-EOA identity must incept a KEL (with pre-rotation, **ideally** to PQ-capable keys) before E" — *ideally* is wrong. Pre-rotation is hash-shielded only as a **commitment**; cashing it out requires revealing the next public keys and signing with them. If the revealed next keys are classical (secp256k1/P-256) and E has passed, the reveal is forgeable the moment it's visible (and near E, mempool-reveal racing is the canonical CRQC attack in the quantum-emergency literature). So identity survival at E actually requires ALL of: (1) KEL machinery shipped + externally reviewed + adopted; (2) a NIST-final PQ scheme; (3) an EVM verifier/precompile for it **on the chains that matter** (EF targets ~2029 for L1; L2s lag); (4) the PQ algoTag minted (currently deliberately unminted); (5) the author actually rotated to (or pre-rotated to and then revealed) PQ keys **before** E. The doc's own algoTag policy defers (4) until (2)+(3) exist — correct, but it means the ~2030 deadline stack has five serial dependencies, of which the doc names one.
- **Fix exists inside design:** yes — rewrite §5.4: replace "ideally" with "necessarily (a classical pre-rotation target revealed after E is forgeable at reveal)"; state the five-conjunct stack; note the mempool-reveal race as the reason rotation must complete comfortably before E, not at it. The 3–4-year-runway sentence should downgrade from "adequate, not generous" to "adequate only if the PQ-verifier ecosystem holds EF's schedule — a dependency EFS does not control."

### F2 — SURVIVABLE: "quantum-resistant today at zero cost (KERI's gift)" overclaims
Protects the commitment, not the cash-out (see F1). One clause.

### F3 — SURVIVABLE: §2.6 epoch semantics sentence is garbled
"a signature … verified against evidence anchored AFTER its retirement epoch carries grade 'existed-before-E only if re-anchored'" — as written this grades post-E evidence with a pre-E grade. Intended meaning (per §5.2, which is correct): authorship grade attaches only to evidence anchored (originally or via ERS renewal) **before** E; evidence whose earliest surviving anchor is post-E is hearsay. Rewrite the schema-semantics line to match §5.2; this is frozen Codex text, so the garble matters.

### F4 — SURVIVABLE: the 53-bit µs clock exhausts ~2255
Fine for the 100-year mission; the Codex should state the horizon and note bit 63 (reserved, MUST be zero) as the extension seam so year-200 successors aren't archaeologists.

Positives, for balance: the anchored-vs-shoebox split (FM-11) is the most honest statement of post-CRQC signature decay in the corpus; the epoch-table retire-only monotonicity is right; "P-256 buys zero PQ margin" is stated where wallet vendors routinely fudge it; deferring PQ algoTag minting is the correct anti-imitation move.

---

## 7. Attacks attempted that FAILED (the design holds — recorded so they aren't re-run)

1. **Overturn in-place (§4.1) for new-identity+REDIRECT:** failed. N re-runs social migration per-author forever, punishes year-0 adopters, and the theft race relocates rather than disappears. U + D1/D2 fixes dominates.
2. **Break ID-SHAPE-1 / shape confusion:** failed. Math checks (2^-96 honest, 2^160 targeted, ~2^128 joint); the re-salt rule converts it to an invariant. Reserved-word check redundant in v2 but correctly future-proof.
3. **Forge the union tie-break (§1.3):** an attacker can grind envelopeDigest downward to win exact-tie reads — but ties require the same (author,seq), i.e. the attacker already holds the key; the read is graded `contested`; no privilege gained. Holds.
4. **Master-key latch via deployment (§4.2):** peer-deployment + union-read genuinely has no trusted deployer in the auth path; options (a)/(b) are correctly rejected for the right reasons. Holds.
5. **Seq/device-bit equivocation manufacturing:** SeqOccupied-not-duplicity + bump-and-resign + contested-grade tie-break structurally exclude the SSB death and honest-devices-branded-liars. Holds. (Residual FM-8 is honestly conditional and self-inflicted.)
6. **ERC-1271 chain-local convenience smuggle:** the categorical rejection (§3.3) survives — a 1271 path mints second-class records inside the one mission-critical property; arch-B's own red team said the same. Holds.
7. **Vector fraud:** every published number reproduces exactly (§0). Holds.

---

## 8. Consolidated register

| # | Finding | Severity | Fix inside design? | Minimal fix |
|---|---|---|---|---|
| A1 | LOSS ⇒ permanent KEL-lockout ⇒ scheduled identity death at E; row missing | SERIOUS | yes (doc) | add row + §5.4 cross-ref |
| A2 | THEFT ⇒ KEL-launch permanent capture + demotion silences victim; row missing, FM-2 understated | SERIOUS | partial (doc now, challenge-window at KEL build) | add row; strengthen FM-2 |
| A3 | Encrypted-content consequences absent (theft⇒retroactive decryption; loss⇒own-data loss) | SERIOUS (conditional) | yes | add row; rule on key-wrap targets |
| A4 | Expiry self-destructs under LOSS, unrenewably | SURVIVABLE | yes | one cell |
| A5 | No org-variant consequences (cold-key loss freezes lens) | SURVIVABLE | yes | one paragraph |
| B1 | Quiet thief forges "strongest" successor grade; earliest-anchored heuristic inverts | SERIOUS | yes | publish-pair-at-creation doctrine + adjudication guidance + table row |
| B2 | targetKind-in-slot-key ⇒ two live successor pointers, cardinality-1 false | SERIOUS | yes | freeze convention to TARGETKIND_OPAQUE only (or contested-on-union rule) |
| B3 | attester==subject read rule unstated | SURVIVABLE | yes | one normative sentence |
| B4 | Tag name unfrozen; 3 writes not 2; homoglyph phishing | SURVIVABLE | yes | freeze names, publish tagId vectors, match-by-id |
| B5 | TAGDEF-under-address-container dependency unstated | SURVIVABLE | yes | handoff line to tag-core |
| C1 | Debian/TUF/PGP analogy inverted; threshold-authorship lockout for DAOs unnamed | SERIOUS | partial | honest rewrite; name residual; DAO doctrine; count toward trigger (c) |
| C2 | Cold key warms under personnel churn | SURVIVABLE | yes | two-tier steward-lens pattern in docs |
| C3 | "smaller than any prior system of this class" beatable by ATProto hosted recovery | SURVIVABLE | yes | scope to self-custody class |
| D1 | Rotation fail-open/chain-local forever; Etched kernels bare-rule consumers forever; unnamed FM | SERIOUS | yes | FM-14 rotation-locality + inception-replication doctrine |
| D2 | Divergent cross-chain inceptions: frozen union rules have no KEL-fork rule | SERIOUS | yes (freezable now) | contested/fail-closed rule parallel to record tie-break |
| D3 | "same statement as revocation" false symmetry (blast radius; expiry doesn't port) | SURVIVABLE | yes | weaken to "same grade structure" |
| E1 | Reserved kinds (KIND_KEL/ANCHORSET) not admission-rejected in v2 | SERIOUS | yes (one rule) | `ReservedKindTag` rejection, closed list |
| E2 | Union rules levy unstated kernel state requirements (admission order + slot history state-walkable) | SERIOUS | yes | two §8.1 handoff lines |
| E3 | §5.4 silently amends substrate hedge→dated obligation | SURVIVABLE (governance) | yes | named amendment; James ratifies |
| E4 | Reserved-format review scoped as a rider on envelope review | SURVIVABLE | yes | first-class review line item |
| F1 | PQ deadline is a five-conjunct stack; "ideally PQ-capable" must be "necessarily" | SERIOUS | yes | rewrite §5.4 |
| F2 | Pre-rotation "quantum-resistant at zero cost" overclaims | SURVIVABLE | yes | one clause |
| F3 | §2.6 epoch semantics sentence garbled (frozen text) | SURVIVABLE | yes | rewrite to match §5.2 |
| F4 | seq clock exhausts ~2255; extension seam unstated | SURVIVABLE | yes | Codex note (bit 63) |

**Bottom line:** ship-shaped after fixes. The rulings (bare-EOA first, single-sig authorship, in-place succession, peer deployment, no-1271, reservation-with-deadline) all survive adversarial pressure. Every serious finding has an in-design fix costing doc text, one admission rule (E1), one frozen read rule (D2), doctrine hardening (B1/B2), and two handoff lines (E2). Nothing here justifies reopening the settled v2 direction.
