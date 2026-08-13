# EFS 2.0 carry-in register — the pass's binding evidence ledger

**Stage A evidence corpus — intake audit of 2026-08-12, durable record.**

Provenance: faithful transcription of the CARRY-IN and RULINGS lanes of the six-lane
intake audit (`scratchpad/audit-lanes.json`, 2026-08-12), reorganized by proposed label
and deduplicated. No re-research was performed; every VERIFIED/PLAUSIBLE mark and
severity is the intake auditor's, carried unchanged.

**Why this register exists** (intake CARRY-IN finding 1, severity **BLOCKING**,
VERIFIED): the greenfield spine (README / system-constitution /
core-architecture-candidate / kickoff) carries lens-pass, KEL, privacy, and
on-chain-completeness results **only at requirement level**; grep confirms none of the
mechanism-level lessons (LR-1/LR-2/LR-3, EIP-7825 page physics, the CREATE2 plan store,
the four absence sources, the 6+1 axes) appear in any spine doc —
owner-decision-inbox.md LP-1…LP-10 (~lines 208-252) restates each item as
requirement-level greenfield evidence, confirming mechanisms were deliberately dropped;
kickoff lines 33-34 routes evidence sources "from the README only when the relevant
question requires them." Without this register the deep pass will rediscover or
contradict those results. Every import below carries the kickoff's label vocabulary
(kickoff lines 39-41): **nothing lens- or KEL-derived is owner-ratified.**

Label semantics (per kickoff + PM directive): [OWNER RULING] — attributed authority,
cite date/line; [DERIVED INVARIANT] — evidence-derived, cite doc + section;
[HYPOTHESIS] — carries a named gate/fixture that would falsify it; [PROPOSAL] — a
design choice with rationale; [REJECTED] — cite the kill source. Silence never adopts a
proposal (PM execution default). Each entry names its **invalidation surface** in the
greenfield frame; the most common surfaces are: a Realm gas profile changing the
physics, the new Record/Binding algebra *dissolving* (rather than falsifying) a rule —
in which case the chapter must show the explicit mapping — and measured aggregate gas
failing budget, which per kickoff lines 104-107 **returns to James rather than being
silently dropped**.

Index: OR-1..OR-7 standing owner rulings; DI-1..DI-14 derived invariants; HY-1..HY-5
hypotheses with gates; RJ-1..RJ-4 rejected imports; PR-1..PR-5 proposals imported with
evidence.

---

## A. Standing owner rulings

### OR-1 — Item F: equivocation limitation, TOCTOU refutation, challenge window

- **Proposed label**: [OWNER RULING] (2026-07-15; owner-rulings.md ~lines 51-53, 67)
  plus a mechanism-independent [DERIVED INVARIANT] (the TOCTOU argument).
- **Severity at intake**: BLOCKING (carry-in lane); the spine's silent drop of it is a
  SERIOUS rulings-lane finding (see intake-findings).
- **What it is**: the chain keeps the LWW winner, not the conflict; there is **no
  on-chain collision/duplicity bit** — it is TOCTOU-defeated (a read-time collision bit
  never protects a contract that already acted; the attacker controls timing, so the bit
  stops only clumsy simultaneous equivocation); contracts needing certainty against
  untrusted authors use closed trusted author sets or a challenge-window (delay +
  re-check) pattern, made decision-scoped by LR-3(ii). Ratified wording (VERIFIED,
  owner-rulings.md:51): "on-chain gates use closed, trusted author sets; EFS does not
  guarantee contracts can detect equivocation, and contracts needing certainty against
  untrusted authors must use a challenge-window (delay + re-check) pattern." Line 67
  ties the full-body spine to preserving both siblings for client-side detection.
- **Source**: VERIFIED — owner-rulings.md:51-53 (attributed to James, clinching argument
  recorded), :67; consumed by lens-spec.md §3.4; lens-pass-synthesis §2.1.6 corrects an
  inherited FS-LENS/1 violation toward it ("SAME_SLOT_COLLISION is not an E2 line
  item").
- **Invalidation surface**: partially invalidated **in scope, not in substance** if the
  greenfield Binding CAS design makes same-principal equivocation at cardinality-one
  positions structurally impossible — the challenge-window pattern still governs
  untrusted-author threshold/count gates. No greenfield candidate may reintroduce kernel
  duplicity state without a new ruling; the TOCTOU reasoning survives any Record/Binding
  algebra. PM execution default (binding): preserve the equivocation/TOCTOU lesson and
  challenge-window safety while leaving exact collision-state mechanics unfrozen.
  Related correction the record model must consciously re-decide (VERIFIED, survivors
  lane): assumptions-and-requirements §12 item 7 (line 533) **removed** the
  same-(principal, order) equivocation rule — do not inherit it by accident, and do not
  forget that it was removed.

### OR-2 — Chains-don't-die assumption (scope now unowned)

- **Proposed label**: [OWNER RULING] as adopted (2026-07-10 context); its **extension to
  fresh-L3 Realms is an open owner decision**, not a ruling.
- **Severity at intake**: SERIOUS (rulings lane).
- **What it is**: "ADOPTED (James): assume a blockchain persists indefinitely and stays
  queryable" (VERIFIED, owner-rulings.md:11), with the :16 NET effect
  ("home-chain-authoritative + home chain always queryable ⇒ … definite on-demand
  read"). The assumption was adopted in the one-persistent-home-chain context; the
  2026-08-12 ruling (owner-rulings.md:185-188) makes "a qualifying EVM Realm can stand
  alone" on a fresh L3 first-class — and fresh L3s dying is realistic in a way Ethereum
  L1 dying is not. Grep across all four spine docs for die/dead-chain/death/persist/
  mortality/queryable: zero hits. The pruning half IS carried mechanically (constitution
  210-213: reconstruction never depends on event logs — the EIP-4444 rationale), but the
  assumption boundary itself is not.
- **Source**: VERIFIED — owner-rulings.md:11, :16, :185-188; constitution 210-213.
- **Invalidation surface / handling**: PM execution default (binding): do **not** reopen
  broad dead-chain survival machinery; instead define qualifying-Realm assumptions and
  honest behavior when a source basis is unavailable (e.g. imported-evidence grading
  when a source Realm is unreachable). Whether chains-don't-die extends per-Realm is one
  of the few irreducible owner decisions (kickoff output 6) — surface after evidence,
  not before.

### OR-3 — Mandatory automatic indexing; no writer opt-out; EAS opt-in rejected

- **Proposed label**: [OWNER RULING].
- **Severity at intake**: NOTE (rulings lane — the ruling is carried in the
  constitution/candidate; the kickoff's own text omits it).
- **What it is**: "MANDATORY automatic indexing; EAS opt-in REJECTED (bundle-wide)"
  (VERIFIED, owner-rulings.md:59-60), reaffirmed 2026-08-12 at :204-208 ("an individual
  writer cannot opt out and create invisible half-presence"). Constitution 171-174 and
  candidate 290-291 carry it faithfully ("every matching item is indexed automatically;
  individual writers cannot opt out").
- **Source**: VERIFIED — owner-rulings.md:59-60, :204-208; constitution 171-174;
  candidate 290-291.
- **Invalidation surface**: none at requirement level without a new James ruling. Cost
  optimization may vary **Type-creator-declared index scope** or return the tradeoff to
  James — never per-writer visibility. Writer-opt-out indexing is classified [REJECTED]
  by owner ruling.

### OR-4 — On-chain query acceptance obligations; pay-for-it; return-to-James

- **Proposed label**: [OWNER RULING].
- **Severity at intake**: BLOCKING (carry-in lane, as part of the completeness trilogy
  carriage).
- **What it is**: the 2026-08-12 ruling explicitly keeps "typed backlinks/reverse
  membership, revocation-aware current counts, content-digest lookup, authored-data
  enumeration, full state-readable Record bodies, bounded contract reads" as acceptance
  obligations (VERIFIED, owner-rulings carriage cited in carry-in lane). Original
  strength of the count ruling: owner-rulings.md:49 "Do NOT ship advisory only … PAY for
  it." The revocation-aware-counter-vs-advisory-only decision returns to James **only
  after the aggregate gas snapshot** — one bundle, not per-feature (onchain-
  completeness.md §4: "price this whole bundle… as ONE gas snapshot"). Kickoff lines
  104-107 carry the return rule: "If an adopted outcome fails the total budget, return
  that exact tradeoff to James; do not silently remove it."
- **Source**: VERIFIED — owner-rulings.md:49 and the 2026-08-12 obligation list;
  onchain-completeness.md §4; kickoff 104-107; constitution 180-184.
- **Invalidation surface**: only a new owner ruling after the priced bundle.

### OR-5 — Universal deterministic IDs (ratified by reference)

- **Proposed label**: [OWNER RULING] (2026-08-08, @james).
- **Severity at intake**: NOTE (rulings lane — an attribution-hygiene finding, not a
  substance dispute).
- **What it is**: "Universal deterministic EFS identities remain required" — ruled by
  @james 2026-08-08, recorded in Decisions.md:21; the kickoff's owner-ratified frame
  (line 38) lists "universal deterministic IDs". owner-rulings.md's own 2026-08-12
  obligation list (:184-188) never mentions deterministic IDs and incorporates Aug-8 by
  reference only (:176-177: "carries forward the August 8 ruling previously recorded in
  [[Decisions]]").
- **Source**: VERIFIED — Decisions.md:21; kickoff:38; owner-rulings.md:176-177,
  :184-188.
- **Invalidation surface**: none; cite Decisions.md:21 directly until owner-rulings
  inlines it (proposed spine edit, see intake-findings).

### OR-6 — Risk-bearer selects the policy/Lens

- **Proposed label**: [OWNER RULING], already carried in the spine — **no re-import
  needed**, only ABI-level enforcement.
- **Severity at intake**: NOTE (carry-in lane, design-center facts entry).
- **What it is**: the party bearing the risk selects the resolving Lens/policy; a
  beneficiary-supplied plan cannot authorize the beneficiary. Carried verbatim in the
  system-constitution "Lenses" section and restated in owner-decision-inbox LP-6.
- **Source**: VERIFIED — system-constitution Lenses section; owner-decision-inbox LP-6;
  assumptions-and-requirements R-L8.
- **Invalidation surface**: none; the Stage A obligation is enforcement — the read ABI
  must reject caller-supplied authorizing policy, and the bakeoff carries the
  beneficiary-self-authorization negative test (see intake-findings, spine lane).

### OR-7 — Opt-in unlinkable personas remain expressible

- **Proposed label**: [OWNER RULING] at requirement level (the July adoption); the KEL
  persona *mechanism* is superseded.
- **Severity at intake**: NOTE (rulings lane).
- **What it is**: unlinkable personas are "an opt-in capability, not the paranoid
  default" (VERIFIED, owner-rulings.md:73) with the course-corrected keystone at :90
  (separate-KEL personas grouped in the local OS profile). The mechanism home is
  superseded (owner-rulings.md:180-183), but the requirement-level lesson — opt-in
  unlinkable personas plus one-place management/recovery UX must stay expressible — is a
  survivor the constitution does not carry (nearest text: constitution 249 research
  seams; the 137-139 extension list omits personas).
- **Source**: VERIFIED — owner-rulings.md:73, :90, :180-183; constitution 137-139, 249.
- **Invalidation surface**: a new owner ruling. Stage A handling: the PrincipalId
  bakeoff (kickoff axis 2) should include the probe "can one root manage multiple
  unlinkable account Principals later?"; the extension-requirements list should name
  personas or record explicit deferral (proposed spine edit).

---

## B. Derived invariants

### DI-1 — The read-honesty core: six-part tuple, anti-fallthrough, four absence sources

- **Proposed label**: [DERIVED INVARIANT].
- **Severity at intake**: BLOCKING.
- **What it is**: a read result is the six-part tuple (authorization / existence /
  freshness-basis / availability / slot state / completeness) that must never collapse
  to one label; **UNKNOWN never falls through** — first-trusted-wins is anti-monotone
  under missing data, so missing data stops resolution and only a proof of absence
  yields to the next source; absence may ground **only** in the four absence sources,
  with the closure-manifest FINAL-scope precondition — budget exhaustion, partial
  replicas, hosted-RPC bare word, deny hits, whiteouts, and author checkpoints **never**
  ground absence. Sharpest safety finding behind it: the
  INCOMPLETE_BUDGET→signed-durable-false-absence attack (lens-pass-synthesis LN-7).
- **Source**: VERIFIED — joined-pass-synthesis.md JR-1 ("a read result is a tuple… The
  F-15 rule is binding"); lens-read-gotchas throughline + the two binding rules;
  lens-spec.md §6.2 ("a closure manifest commits only FINAL-enumerated scopes;
  PARTIAL(cursor) scopes never yield absence"). Partial carriage VERIFIED: the
  constitution carries FOUND/ABSENT/conflict/unsupported/UNKNOWN and "UNKNOWN is never
  absence," but **not** the four absence sources, the FINAL precondition, or the
  anti-fallthrough rule.
- **Invalidation surface**: only by restructuring the read algebra — in which case the
  chapter must show the explicit mapping (the anti-monotone argument is
  mechanism-independent). The greenfield candidate's "complete Realm-local absence at a
  basis" index contract is a **new absence source** — it must be reconciled against the
  four-source list, not used to re-derive absence semantics from scratch.

### DI-2 — On-chain completeness trilogy, THE LINE, predicate-keyed postings

- **Proposed label**: [DERIVED INVARIANT] (three axes + THE LINE are requirement-level,
  owner-carried); predicate-keyed-postings-with-revocation-story is a derived lesson
  every candidate index layout must satisfy.
- **Severity at intake**: BLOCKING.
- **What it is**: "works on-chain" is three independent axes — durability ≠ queryability
  ≠ composability; durable-but-unindexed = off-chain in every way that matters;
  event-derived = off-chain under EIP-4444. Any reverse index must key the
  predicate/role and carry a live-revocation story or hot-target queries gas-blow (the
  B4 postings word lacking definitionId was the v1→v2 headline defect, with O(all
  postings) consequence). Raw counts are attacker-inflatable by spray-then-self-revoke.
  THE LINE: cost scales with the answer, never global history; pricing discipline is one
  aggregate gas bundle because "the gas-cheapest do-nothing is the Tier-3 outcome."
- **Source**: VERIFIED — onchain-completeness.md §0 (James's 2026-07-10 constraint
  verbatim), §1, §2b R10, §4, §6. Carriage VERIFIED: owner-rulings 2026-08-12 obligation
  list; candidate already keys reference postings "by target and role"; kickoff
  measurement gate lists live counts, author enumeration, typed backlinks,
  content-digest lookup.
- **Invalidation surface**: effectively not invalidatable at requirement level without a
  new James ruling. The v1 file:line evidence and the B4 word layout are **dead
  mechanisms** — do not resurrect the layout, only the lesson.

### DI-3 — EIP-7825 page physics (venue-conditional)

- **Proposed label**: [DERIVED INVARIANT] — venue-conditional physics, not an EFS
  mechanism.
- **Severity at intake**: BLOCKING.
- **What it is**: the live 16,777,216-gas per-tx cap makes wide sorted contract-native
  directory pages physically impossible (128-item × 55-principal naive page ≈ 29.5M
  gas), so "bounded candidate pages + exact venue-local point resolution + fixed-basis
  client materialization" is the only honest on-chain enumeration promise.
- **Source**: VERIFIED — lens-pass-synthesis.md LN-4; lens-spec.md §1;
  lens-read-gotchas listing section. Full FACT/policy entry: standards-audit §2.1.
- **Invalidation surface**: a Realm profile without the cap or a materially raised cap —
  in which case the 2026-07-11 "should-not-be-promised" cost argument still applies.
  Re-verify the cap against the adopted Realm gas profile before designing the
  index/page ABI under it.

### DI-4 — KEL lesson set (a)–(h) for the additive account-Principal seam

- **Proposed label**: [DERIVED INVARIANT] for (a)–(h); the home topology, HomeRegistry,
  and full KEL event grammar are [HYPOTHESIS]/[PROPOSAL] only (kel.md's own freeze
  warning: no KEL bytes freeze without convergence + independent crypto review; the
  topology was downgraded by kel.md's 2026-07-12 correction banner and reopened by the
  2026-08-12 ruling).
- **Severity at intake**: BLOCKING.
- **What it is**: (a) read-time-only authorization permits removed-key backdating —
  authoritative history needs **admission-time validation** with a persisted
  authorization basis/receipt; (b) the envelope needs an **authority seam** (author +
  authorityId + authEpoch or equivalent version headroom) reserved NOW, with record
  identity excluding actor/grant carriage so reauthorization never changes record ID;
  (c) revocation is prospective; (d) pre-rotation must commit the entire next control
  state (no root ADD_KEY/REMOVE_KEY); (e) authority priority: precommitted next > veto >
  recovery > current; (f) epoch bump = O(1) fleet revocation; (g) the confluence
  boundary — state-dependent authorization is incompatible with an order-independent
  kernel, and "plain kernel now, KEL-aware peer later" is rejected; (h)
  signed-but-never-admitted artifacts are irreducibly PORTABLE-SIGNATURE-ONLY.
- **Source**: VERIFIED — kel.md §3 (failure table: "read-time KEL authorization →
  removed key signs later and backdates order/epoch"), §8.1 (Envelope fields; "claimId
  remains logical-record based… and excludes actor/grant carriage so reauthorization
  does not change the record's identity"; first-admission-binds-primary), §8.2
  (admission-time ruling + EnvelopeAuthReceiptV1/ClaimAdmissionV1), §8.3 (confluence
  boundary; retrofit "rejected as a first-class solution"), §1.5, §6, §7.2-7.3, §9
  ("without a trusted ordering witness, no verifier can know whether the signature was
  created before or after removal").
- **Invalidation surface**: only if the greenfield Core permanently forgoes
  rotation/delegation/recovery — which the kickoff explicitly requires as an additive
  path. **The now-or-never piece for the smallest Core is (b)**: if v0 ships only
  immutable account Principals, rotation lessons stay latent, but the Envelope/RecordId
  encodings must reserve the authority-basis seam or managed Principals later change
  record identity — exactly the "KEL added later as a peer" failure kel §3 documents.

### DI-5 — LR-2: claim-conditional authority

- **Proposed label**: [DERIVED INVARIANT] for the evaluation rule; the on-chain UNKNOWN
  exhaustiveness enumeration is [HYPOTHESIS] (see HY-5).
- **Severity at intake**: SERIOUS.
- **What it is**: principal authority status is evaluated only for principals holding a
  PRESENT claim at the position, at or above the selected winner. This alone restores
  identical direct/roster semantics and deletes the gate-wedging lever: an attacker
  parking an ungradeable entry cannot wedge resolution for positions where that
  principal never claimed.
- **Source**: VERIFIED — lens-spec.md §3.1 (LR-2, with the on-chain UNKNOWN enumeration
  marked "(PLAUSIBLE — V-3: exhaustiveness)"); lens-pass-synthesis LN-3 and §2 (binding
  repair ledger).
- **Invalidation surface**: potentially **dissolved** (not falsified) if greenfield
  admission pre-validates authority so resolution never re-grades — then the invariant
  migrates into the admission-receipt design and the chapter must say so explicitly.

### DI-6 — LR-3: verify above the winner; rosters are hints, never correctness

- **Proposed label**: [DERIVED INVARIANT] for the probe rule and hint-not-correctness
  principle; the cost curve is [HYPOTHESIS] (see HY-4).
- **Severity at intake**: SERIOUS.
- **What it is**: every resolution direct-probes every entry ranked strictly above the
  selected winner; any claimant roster / auxiliary index is a planning hint whose
  completeness is never a correctness dependency; equal-tier CONFLICT early-exit is
  legal only under the plan-committed allTiersSingleton bit; the challenge-window
  recheck is decision-scoped (the originally adopted item-F instantiation had no sound
  form at busy positions).
- **Source**: VERIFIED — lens-spec.md §3.2 (marked PLAUSIBLE — V-4/V-5/V-6);
  lens-pass-synthesis LN-3 ("the claimant roster becomes a pure planning hint… repairing
  the adopted item-F pattern").
- **Invalidation surface**: measured aggregate gas at the 15-55 center failing budget
  under the new Binding layout — per the kickoff's own gate, that exact tradeoff returns
  to James rather than being silently dropped.

### DI-7 — LR-1: no on-chain CBOR; fixed-width bounded contract objects; two constants

- **Proposed label**: [DERIVED INVARIANT] for the encoding discipline and the
  two-constants separation; the exact PlanV1 layout and cap numbers are [PROPOSAL] (see
  PR-1).
- **Severity at intake**: SERIOUS.
- **What it is**: no contract ever parses CBOR — the contract-tier policy artifact is
  one packed, big-endian, fixed-width, offset-free byte layout with plan-committed
  fan-out caps and exact-length frames; deterministic-CBOR stays client-side. The CORE
  per-plan entry cap and the client compile ceiling are **two constants doing two jobs**
  — conflating them was the MAX_LENSES=20 mistake (retired).
- **Source**: VERIFIED — lens-spec.md §2.2 ("PlanV1 — packed, big-endian, fixed-width,
  offset-free… No contract parses CBOR"), §2.4 (candidate 64 vs 256, "[LP-4]");
  lens-pass-synthesis LN-3 and §9 (MAX_LENSES=20 retired).
- **Invalidation surface**: survives even if the greenfield ResolutionPlan becomes an
  ordinary admitted Record — the contract-parsed projection must still be fixed-width
  and bounded. The specific caps are invalidated by fresh benchmarks **by design**.

### DI-8 — Prospective revocation + minAuthEpoch floors (two halves of one fact)

- **Proposed label**: [DERIVED INVARIANT], imported as a pair.
- **Severity at intake**: SERIOUS.
- **What it is**: KEL actor removal is prospective, so "revocation empties the slots" is
  false — consumers gating on authority need explicit minAuthEpoch floors (or an
  equivalent), and any authority-grade consumption must treat removal as affecting only
  later admissions. Imported paired because the two halves get lost separately.
- **Source**: VERIFIED — lens-pass-synthesis §2 (AO-16: "minAuthEpoch floors (KEL actor
  removal is prospective — the 'revocation empties slots' defence was false)") and
  §2.1.3 precedence correction; kel.md §7.3 ("Actor removal is prospective.
  Home-admitted records retain historical attribution"); lens-spec §3.3 carries
  minAuthEpoch in the GATE hard rules.
- **Invalidation surface**: effectively none — making removal retroactive contradicts
  the constitutional invariant kel §1.5 (recovery does not rewrite history).

### DI-9 — Privacy Layer-1: committing AEAD binding, key-role coupling, tier dichotomy

- **Proposed label**: [DERIVED INVARIANT] for the binding requirement, coupling rule,
  and tier dichotomy; the exact constructions are [PROPOSAL] with unusually strong
  evidence (see PR-2).
- **Severity at intake**: SERIOUS.
- **What it is**: committing AEAD binding wrap↔content (dekCommit in the AAD of both
  prologue and wrap) plus EtM anti-equivocation are MUSTs for the private tier. Key
  roles are strictly purpose-separated with the coupling rule: "no root secret
  (encryption, scan, shred, ZK-credential) may be derivable from the identity signing
  key or any signature by it" (JD-7). Recoverable and shreddable are mutually exclusive
  tiers, and shared/team content is recoverable-only, forever.
- **Source**: VERIFIED — privacy-pass-synthesis.md PC-5 (dekCommit = HKDF-SHA-256
  formula; "survived all three transplant/replay/equivocation games"; X-Wing HPKE
  single-shot Seal; twice cryptographer-reviewed), PC-4 (tier split + "shared/team
  content is recoverable-only, forever"), §3 (JD-7 verbatim); kel.md §1.2 (key-role
  separation constitutional invariant). Mapping VERIFIED: the kickoff's sensitive-Record
  fixture names AEAD-transplant rejection and purpose-separated keys — this is its
  evidence base.
- **Invalidation surface**: the new Record/Occurrence algebra changes the AAD binding
  identifiers (fileId → RecordId/OccurrenceRef), so the formula's **inputs must be
  re-derived** even though the binding requirement stands.

### DI-10 — Dictionary / correlation-oracle checklist

- **Proposed label**: [DERIVED INVARIANT], in checklist form — these are attack classes,
  not mechanisms; they survive any redesign.
- **Severity at intake**: SERIOUS.
- **What it is**: opaque occurrence keys close the low-entropy identifier oracle (making
  PSI unnecessary — PC-13 ruled); a slot keyed on a primary principal leaks persona
  existence/count (the A1 oracle applied to EFS itself — why persona-link rows were
  rejected); per-leaf high-entropy salts are required because a single root salt is
  insufficient against dictionary attacks on known public keys; blinded-name derivation
  needs a pinned domain constant + golden vectors; remote batched resolution of a
  personal trust set ships the whole roster to the endpoint (a better fingerprint than a
  cookie) — default resolution is local-replica-first. Honest limit (LP-7): confirmation
  of a correctly-guessed policy cannot be prevented.
- **Source**: VERIFIED — privacy-pass-synthesis PC-7, PC-8, PC-13 (verbatim ruling);
  kel.md §10.1; lens-pass-synthesis LN-9 + §2.1.2; lens-spec §7.2 (LP-7).
- **Invalidation surface**: none as attack classes. Stage A obligation: any greenfield
  content-derived public identifier (names, anchors, wrapped keys, Plan-store addresses)
  must pass the dictionary-oracle and existence-oracle checks; any per-principal keyed
  slot must be checked against the A1 oracle. Maps directly onto the kickoff's "zero
  accidental plaintext/dictionary identity leakage" and "retrieval-observer disclosure"
  fixture lines.

### DI-11 — GATE / install-profile attack repairs (transferable conformance rules)

- **Proposed label**: [DERIVED INVARIANT] over whatever install/gate profile the
  greenfield pass produces.
- **Severity at intake**: SERIOUS.
- **What it is**: ceremony-time re-derivation of the current release in trusted chrome
  (AV-19, rollback-by-presentation — "the pass's sharpest product finding");
  policyMaxAge against TUF-freeze (AV-15); advisory evaluation over the full pinned
  dependency closure (AV-16); closed action tables with unknown label values → NONE
  (AV-17); STOP-on-relinquish (no fallthrough to a squatter); source-level relinquish
  grading UNEVALUATED rather than clean (AV-20). These re-derive from public
  supply-chain prior art (TUF freeze/rollback classes), which strengthens the carry-in.
- **Source**: VERIFIED — lens-spec.md §3.3 (the [LP-6] hard-rule list) and §4
  (ADVISORY/1 source-level relinquish); lens-read-gotchas GATE section;
  lens-pass-synthesis LN-5 (AV-15/16/17/19/20 in the binding repair ledger).
- **Invalidation surface**: only if the greenfield Core drops contract-consumable gates
  entirely — which the smart-contract-usable-Lens owner ruling forbids. The kickoff's
  Nanda and Arcade fixtures (curator selection, advisories) will hit every one of these
  attacks.

### DI-12 — Batch/tier privacy MUSTs and contracts-read-public-only

- **Proposed label**: [DERIVED INVARIANT] (PC-11 co-batching separation; PC-6
  quantum-expiry honesty line, also positioning language; contracts-read-public-only).
- **Severity at intake**: SERIOUS.
- **What it is**: separate envelopes per privacy tier — co-batching public and private
  leaves creates linkage (PC-11 MUST; the kickoff's "public/private batch-linkage
  rejection" fixture line is sourced from it). The quantum-expiry honesty line:
  post-quantum content secrecy, classical-only recipient unlinkability, retro-linkable
  at CRQC (PC-6 verbatim). And: "if a contract must read a value, do not encrypt it" —
  contracts consume public values, not secrets.
- **Source**: VERIFIED — privacy-pass-synthesis PC-11, PC-6; lens-read-gotchas config
  section (contracts-read-public-only); carried at constitution 244.
- **Invalidation surface**: none identified; tier-linkage rules re-express over whatever
  the new Envelope/batch structure is.

### DI-13 — Read/enumeration ABI + client conformance rules (design-center trio)

- **Proposed label**: [DERIVED INVARIANT].
- **Severity at intake**: NOTE.
- **What it is**: FSP-BASIS-1, the one-basis rule — never interleave paged enumeration
  with point reads (phantom/ghost anomalies); CONFLICT rows render no claimant-derived
  content (the tie-break was grindable into a phishing surface — AV-21/AO-8); and the
  six-answers-never-a-checkmark UI conformance rule (collapsing the DI-1 tuple to a
  checkmark is non-conformance).
- **Source**: VERIFIED — lens-read-gotchas (FSP-BASIS-1 phantom/ghost; AV-21/AO-8
  conflict rendering; tuple-collapse non-conformance).
- **Invalidation surface**: none as rules on the read/enumeration ABI and client
  conformance; re-key onto the new ABI names.

### DI-14 — The §10 grade axis: never compress to a Boolean valid

- **Proposed label**: [DERIVED INVARIANT] (survivor requirement; carried here because
  the vocabulary change puts it at risk).
- **Severity at intake**: NOTE (survivors lane; risk marked PLAUSIBLE).
- **What it is**: the authorization/freshness grade axis — PORTABLE-EVIDENCE /
  AUTHORITY-ADMITTED / SNAPSHOT@H / CURRENT@H / FOREIGN-LOCAL — must survive; "never
  compress these to a Boolean valid." The kickoff's FOUND/ABSENT/CONFLICT/UNKNOWN
  vocabulary is a **presence** axis, not an authorization-basis axis; the result model
  must carry the two axes orthogonally, and traceability should show R-X2/R-K8/§10
  mapping onto both.
- **Source**: VERIFIED text — assumptions-and-requirements §10 (lines 378-392), R-X2
  (line 189), R-K8 (line 178); kickoff lines 60-61, 108-111, 51.
- **Invalidation surface**: a restructured result model that demonstrably preserves the
  distinctions under new names (mapping required); collapse is a red-team defect.

---

## C. Hypotheses with named gates

### HY-1 — CREATE2/EXTCODECOPY content-derived Plan store (severity: SERIOUS)

- **Proposed label**: [HYPOTHESIS] — gate: fixture **V-2** (named by the source itself
  as "the single highest-leverage" verification debt).
- **What it is**: content-derived immutable-code Plan storage (SSTORE2-shape: CREATE2
  from planId, consumers derive the address and EXTCODECOPY) makes the plan store an
  untrusted party — "address derivation is the verification" — closing the
  trusted-plan-registry hole, the lens pass's sharpest no-Graph leak. Never
  fixture-verified; the clearest PLAUSIBLE-not-VERIFIED carry-in in the whole set.
- **Source**: VERIFIED that the source marks it PLAUSIBLE — lens-spec.md §2.3
  "(PLAUSIBLE — V-2 fixture is the gate)"; lens-pass-synthesis LN-3 and §6 VECT.
- **Invalidation surface**: (1) the greenfield Core already keeps a state-readable
  Record spine, so storing Plans as ordinary admitted Records may **dominate** and make
  the CREATE2 trick unnecessary — the requirement is "the store is not a trusted party,"
  CREATE2 is one realization; (2) EVM evolution (EOF, code-size limits,
  EXTCODECOPY/initcode repricing) on the adopted Realm profile.

### HY-2 — Privacy's no-frozen-surface result transfers to the new algebra (severity: SERIOUS)

- **Proposed label**: [HYPOTHESIS] — gate: re-verify against the greenfield
  Record/Envelope algebra (it was proven against the July kernel, not the new
  candidate).
- **What it is**: privacy demanded almost no frozen kernel surface — zero new
  kinds/state/envelope changes; the linchpin is F-5: the encryptionKey row's blob frozen
  as an open-ended typed-multi-key structure so future KEMs/scan keys are
  post-freeze-addable. Translated: Core needs no privacy-specific admission state;
  encryption rides ordinary open-ended typed Records + client crypto. Treated as a
  design constraint: any candidate adding admission-visible privacy machinery must
  justify breaking it.
- **Source**: VERIFIED — privacy-pass-synthesis §0; PLAUSIBLE (inference): transfer to
  the greenfield algebra.
- **Invalidation surface**: the re-verification itself; a candidate that genuinely needs
  admission-visible privacy machinery falsifies it and must say so.

### HY-3 — The 15–55 trusted-principal design center (severity: NOTE)

- **Proposed label**: [HYPOTHESIS] — gate: V2-E2's 1/8/32/64-Principal benchmark
  profiles (numbers are evidence-gated by design); the constitutional lens-scale demand
  (50/100/256, R-L4/A-7/D-10) rides the same harness.
- **What it is**: the validated design center is 15-55 trusted principals; "what breaks
  past it is gate composability first, latency second, legibility third";
  effective-authority counting spans all saved Views.
- **Source**: VERIFIED — lens-spec §9 + LN-10 (LP-10 pin-only with the Nostr WoT field
  failure as evidence); assumptions-and-requirements R-L4 (50+ owner concern; 256
  measured unknown).
- **Invalidation surface**: the benchmarks; if the center moves, dependent constants
  (caps, page sizes) re-derive.

### HY-4 — LR-3 cost curve (severity: carried inside DI-6, SERIOUS)

- **Proposed label**: [HYPOTHESIS] — gate: the greenfield equivalent of E2 (V2-E2
  1/8/32/64-Principal benchmarks).
- **What it is**: the critic-recomputed gas honesty note — lane floors were ~3×
  understated; the roster lever is worth ~4-7× on cold single-point reads, decaying with
  winner rank.
- **Source**: VERIFIED — lens-pass-synthesis LN-4.
- **Invalidation surface**: fresh measurement under the new Binding layout; budget
  failure at the 15-55 center returns to James (OR-4).

### HY-5 — On-chain UNKNOWN case-set exhaustiveness (severity: carried inside DI-5, SERIOUS)

- **Proposed label**: [HYPOTHESIS] — gate: **V-3** (exhaustiveness verification debt,
  open).
- **What it is**: the enumeration of on-chain UNKNOWN causes used by LR-2's evaluation
  rule is not proven exhaustive.
- **Source**: VERIFIED — lens-spec.md §3.1 marks it "(PLAUSIBLE — V-3:
  exhaustiveness)".
- **Invalidation surface**: the V-3 exercise; a missed UNKNOWN cause is a safety bug
  class, not a tuning issue.

---

## D. Rejected imports (kill lists)

Import wholesale as [REJECTED] entries with one-line reasons — a strong greenfield
designer will independently reinvent several of these (computed-membership follows,
collision bits, checkpoint absence, ERC-1271 authorship). **Caveat per the greenfield
ruling** (VERIFIED in the carry-in lane): each rejection's reason must be checked for
mechanism-dependence — e.g. "SAME_SLOT_COLLISION rejected" rests on owner item F (still
standing), while some lens-grammar retirements (e.g. `?lenses=` arrays) are moot if the
grammar itself is not inherited; import those as historical evidence, not live
constraints.

### RJ-1 — Lens-pass kill list (31 retired phrasings)

- **Source**: VERIFIED — lens-pass-synthesis §3 + lens-read-gotchas "Do not reopen the
  kill list".
- **Named examples carried**: checkpoint-grounded absence; MUST-pull-home; a registry
  that answers what a plan is; unqualified "identical plan semantics";
  SAME_SLOT_COLLISION as a live choice; following a computed member set; `?lenses=` /
  `?deny=` arrays.

### RJ-2 — Privacy pass headstones (24)

- **Source**: VERIFIED — privacy-pass-synthesis §2 (all 24 enumerated).
- **Named examples carried**: MLS/TreeKEM on-chain; "forward secrecy" as an EFS word;
  passphrase-derived shred-roots; deterministic FEK re-key; OR-set roster union.

### RJ-3 — kel.md §20 REJECT list

- **Source**: VERIFIED — kel.md §20.
- **Named examples carried**: root ADD_KEY/REMOVE_KEY; read-time-only authority;
  ERC-1271/6492 **envelope** authority; mutable verifier registry; sliding session TTL.
- **Caveat**: the envelope-authority rejection stands (portable artifacts cannot carry
  state-dependent authority); it is a **separate question** from Realm-local
  admission-time ERC-1271 with basis-pinned receipts, which the candidate re-admits and
  which must be re-earned explicitly (see standards-audit §2.5 and intake-findings).

### RJ-4 — Owner-level rejections (cross-references)

- Writer-opt-out / EAS-style opt-in indexing — [REJECTED] bundle-wide by owner ruling
  (OR-3).
- On-chain collision/duplicity bit — [REJECTED] with the TOCTOU refutation recorded
  (OR-1); any proposal to reintroduce it must overcome the recorded refutation, not
  treat it as open ground.

---

## E. Proposals imported with evidence

### PR-1 — PlanV1 exact layout, section structure, cap candidates 64/256

- **Proposed label**: [PROPOSAL] (evidence: lens-spec §2.2, §2.4). The encoding
  discipline behind it is DI-7; the concrete bytes and caps are proposal-grade and
  benchmark-gated by design.

### PR-2 — X-Wing HPKE single-shot Seal; dekCommit HKDF-SHA-256 formula; Padmé buckets

- **Proposed label**: [PROPOSAL] with unusually strong evidence — twice independently
  cryptographer-reviewed (privacy-pass-synthesis PC-5). The binding requirement is DI-9;
  the constructions are proposals whose AAD inputs must be re-derived for
  RecordId/OccurrenceRef identifiers.

### PR-3 — AcceptanceMatrixV1 and the 7th policy-outcome axis

- **Proposed label**: [PROPOSAL] (source: joined-pass-synthesis JR-1 context; the
  six-part tuple itself is DI-1).

### PR-4 — Computed membership: pin-only with per-adoption ceremonies

- **Proposed label**: [PROPOSAL] (validated design-center fact; source: lens-spec §9 /
  LN-10, LP-10, with the Nostr WoT field failure as evidence). The live-follow
  alternative is on the RJ-1 kill list ("following a computed member set").

### PR-5 — CT proof-vocabulary import where completeness gates need provable coverage

- **Proposed label**: [PROPOSAL] (source: STANDARDS lane, standards-audit §3.8) — use
  inclusion/consistency-proof vocabulary only where partial replicas need provable
  coverage; Realm chains already provide the ordering a CT log operator provides.

---

## Interfaces exposed

- Chapters cite register entries by ID (OR-n / DI-n / HY-n / RJ-n / PR-n) instead of
  re-deriving the underlying evidence; a chapter that contradicts a DI must show the
  explicit dissolution mapping; a chapter that adopts an HY must carry its named gate; a
  chapter reinventing an RJ item must cite and overcome the recorded kill reason.
- Binding PM defaults threaded through entries: silence never adopts a proposal;
  equivocation/TOCTOU + challenge-window preserved with collision mechanics unfrozen
  (OR-1); no dead-chain machinery — qualifying-Realm assumptions + honest unavailability
  behavior instead (OR-2); budget failures return to James, never silent removal (OR-4).
- The now-or-never structural reservation for B0: the Envelope authority seam and
  record-identity exclusion of actor/grant carriage (DI-4(b)) — encoding chapters must
  reserve it even if v0 ships only intrinsic account Principals.

## Open items

- D-2/D-5 sovereignty disposition: the kickoff's Realm/no-venue frame appears to
  dispose them, but the survivors-lane auditor could not verify owner-rulings.md
  formally records it (PLAUSIBLE disposition) — the synthesizer must confirm against
  owner-rulings.md; if unconfirmed, R-K11's "two domains cannot both claim unqualified
  CURRENT" becomes a load-bearing check on the Realm design rather than a settled
  premise.
- Whether chains-don't-die extends per-Realm to fresh L3s (OR-2) — an irreducible owner
  decision to surface only after evidence (kickoff output 6; PM directive line 25).
- V-2 (CREATE2 plan store), V-3 (UNKNOWN exhaustiveness), and the V2-E2 benchmark set
  are the named verification debts this register hands to the fixture/harness chapters.
- The four-tier support matrix (required / extension-ready / experimental /
  explicitly-unsupported; owner-rulings.md:121) was never produced or retired — Stage A
  output 7 is its natural home (see intake-findings).
