# EFS 2.0 intake findings — spine, rulings, survivor, and bakeoff-structure ledger

**Stage A evidence corpus — intake audit of 2026-08-12, durable record.**

Provenance: faithful transcription of the SPINE, SURVIVORS, RULINGS, and BAKEOFF lanes
of the six-lane intake audit (`scratchpad/audit-lanes.json`, 2026-08-12), plus the
CARRY-IN lane's routing meta-finding, renumbered into one findings list. No re-research
was performed; every VERIFIED/PLAUSIBLE mark and every severity is the intake auditor's,
carried unchanged. Standards findings live in `standards-audit.md`; mechanism carry-ins
live in `carry-in-register.md` (entries cited here as OR-n/DI-n/HY-n/RJ-n/PR-n).

**Repair note (2026-08-13):** the post-red-team repair updated dispositions,
realization citations, and open-item status only. It did not regrade the underlying
intake evidence, its severity, or its VERIFIED/PLAUSIBLE marks.

Disposition vocabulary: **addressed in Stage A chapter <file>** (chapters in
`scratchpad/stage-a/chapters/`, written concurrently — cited by filename and topic, not
read); **addressed in Stage A deliverable N** (PM directive deliverables 1-8, where no
single chapter file carries it at transcription time); **proposed spine edit** (PM
deliverable 7 — Stage A does not edit shared design files); **deferred to V2-En** (named
inbox gate); **resolved by PM directive** (pm-stage-a-directive.md). Dispositions are
routing, not proof — the red team verifies each claimed "addressed."

Totals: 45 findings — 2 BLOCKING, 12 SERIOUS, 31 NOTE.

Chapter files cited (landed at transcription time): `b0-authorship-envelope.md`,
`b0-binding.md`, `b0-content-locators.md`, `b0-encoding-and-ids.md`, `b0-indexes.md`,
`b0-lens.md`, `b0-principal-authority.md`, `b0-realm-admission.md`.

---

## A. Spine-consistency findings (kickoff vs constitution / candidate / README / inbox)

### IF-01 — Measure or merely specify? (BLOCKING)

- **Claim**: the kickoff is ambiguous about whether the Fable pass measures or merely
  specifies: it demands both "controlled prototype specifications and measurement
  harness" (output 3) and "a complete cost/state-growth table" (output 4), while the
  constitution and README sequence the Fable 5 pass AFTER prototype implementation and
  benchmarking as separate steps.
- **Evidence**: VERIFIED — kickoff lines 160-162; constitution "Freeze discipline"
  324-330 (steps 2-4); README "Build order" 95-101; kickoff line 169 "The prototypes
  are disposable" implies prototyping inside the pass, contradicting the spine's step
  ordering.
- **Disposition**: **resolved by PM directive** — Stage A delivers the exact B0
  baseline, bakeoff specification, and frozen fixture/measurement-harness *interfaces*
  (deliverables 1, 4, 5); measurement itself is a later phase ("A later prototype may
  use a disposable contracts worktree/branch; do not deploy or create a product
  dependency", directive line 20; "Stop after Stage A for review", line 25).

### IF-02 — Lens fixture stops at two Principals; V2-E2 benchmark unexercised (SERIOUS)

- **Claim**: the kickoff's contract-configuration fixture (two Principals) never
  exercises the constitution's Contract-Lens acceptance trace or inbox gate V2-E2 —
  benchmarked 1/8/32/64-Principal Resolution Plans, first/last/absent/conflict/unknown,
  cold/warm, plus a path profile; the beneficiary-self-authorization negative test and
  Lens-side authority-callback abuse (candidate falsifier 8, line 429) are also absent
  from the kickoff attack list.
- **Evidence**: VERIFIED — kickoff line 132; constitution acceptance trace line 309;
  candidate open question line 450; owner-decision-inbox V2-E2 lines 28-31; kickoff
  line 93 vs candidate line 429.
- **Disposition**: `b0-lens.md` addresses the Resolution Plan profile, 1/8/32/64 Core
  scaling, and `LENS-NEG-1` beneficiary self-authorization. The callback-abuse attack
  is realized in `vectors-and-falsifiers.md` CF-8 + AA-2 (zero external authority
  callbacks per Principal) and proposed kickoff edit C1, not in `b0-lens.md`.
  Deliverable 5 owns the 1/8/32/64 Core workload interface; V2-E2 remains the
  measurement gate.

### IF-03 — V2-E5 Realm descriptor / finality observation homeless in the kickoff (SERIOUS)

- **Claim**: inbox gate V2-E5's self-contained Realm descriptor, fresh-L3
  bootstrap-without-registry, and finality-observation requirements have no home in the
  kickoff — the words "descriptor" and "finality" never appear in it; no
  deployment/profile-confusion attack, no registry-free bootstrap fixture.
- **Evidence**: VERIFIED — inbox V2-E5 lines 48-52; constitution open question 353-354;
  candidate open question line 443 and line 61; full-kickoff search confirmed the
  absences.
- **Disposition**: **resolved by PM directive** ("V2-E5's minimal Realm descriptor,
  admission basis, finality observation, upgrade history, and independent
  reconstruction are in scope", directive line 17); addressed in Stage A chapter
  `b0-realm-admission.md` (descriptor, admission/finality split, bootstrap and
  profile-confusion attacks).

### IF-04 — The candidate's eighth bakeoff row (Type schema identity) dropped by the kickoff's seven axes (SERIOUS)

- **Claim**: the candidate's alternatives table has eight rows; the kickoff commissions
  seven axes; the missing row is "Type schema identity: publisher-qualified namespace
  vs semantic spec commitment" (collision of meaning vs convergence of shared
  standards) — kickoff axis 4 maps to the *separate* "Type/query identity" row, not to
  this one.
- **Evidence**: VERIFIED — candidate table lines 407-417, row at line 413 (open choice
  encoded in field name `semanticNamespaceOrSpec`, candidate line 73); kickoff axes
  lines 73-84.
- **Disposition**: addressed in Stage A deliverable 4 (bakeoff specification) as an
  **analysis-only** row per IF-31 — no gas or vector measurement discriminates it;
  decide by written analysis plus golden vectors (two publishers hashing the same spec
  text — same or different ID by declared intent); Type-identity mechanics in Stage A
  chapter `b0-encoding-and-ids.md`.

### IF-05 — V2-E8 loss-aware EAS interoperability at risk of being skipped (SERIOUS)

- **Claim**: V2-E8's "loss-aware EAS interoperability" proof is not exercised by the
  kickoff, and the kickoff's blanket ban on restoring "compatibility" could be read as
  license to skip it — in tension with the spine keeping an EAS adapter as a live
  option (README line 72; constitution 327-328; candidate module 7 line 357).
- **Evidence**: VERIFIED texts; skip-risk PLAUSIBLE inference — inbox V2-E8 lines
  71-75; kickoff lines 19-21, 47-48, 150.
- **Disposition**: **resolved by PM directive** — "Defer the full EAS loss-map
  implementation to V2-E8; preserve and specify the adapter seam here" (directive line
  18). Stage A must distinguish v1-data compatibility (banned) from optional loss-aware
  EAS interop (live V2-E8 item); adapter-seam specification expected with the
  ID/projection seams in Stage A chapter `b0-encoding-and-ids.md` (synthesizer to
  confirm the seam's chapter home); full loss-map **deferred to V2-E8**.

### IF-06 — No gate-coverage map; V2-E6/E7 silently uncovered (NOTE)

- **Claim**: the kickoff never states which inbox evidence gates it covers; V2-E6 (Web
  Client/OS vertical slice, Files/Web/OS parity, guest play) and V2-E7 (Commons venue
  matrix) are exercised by nothing in it — plausibly deliberate Core-pass scoping, but
  undeclared.
- **Evidence**: VERIFIED absence; intentionality PLAUSIBLE — inbox V2-E6 lines 54-61,
  V2-E7 lines 63-68; kickoff lines 143-144, 170-171, 30; constitution traces 317, 303.
- **Disposition**: addressed in Stage A deliverable 3 (traceability) — the pass's
  gate-coverage map must state: evidence generated for V2-E1, E2, E3, E4, E5, E8
  feeding V2-F1; **V2-E6 and V2-E7 out of scope and remain open**.

### IF-07 — Anonymous dataset browsing has no fixture (NOTE)

- **Claim**: "anonymous dataset browsing" is a named constitutional expressibility
  requirement and candidate trace with no kickoff fixture.
- **Evidence**: VERIFIED — constitution lines 275-277; candidate lines 453-454; kickoff
  fixture list 120-140 covers every other item.
- **Disposition**: addressed in Stage A deliverable 5 (fixture interfaces): add a small
  anonymous/guest dataset-browse fixture, or state it is subsumed by the Nanda "guest
  inspection" fixture with the coverage-equivalence argument written down.

### IF-08 — The fifth resolver outcome "unsupported" silently dropped (NOTE)

- **Claim**: the kickoff's FOUND/ABSENT/CONFLICT/UNKNOWN drops the constitution's fifth
  outcome "unsupported", and its proof-semantics gate never names the
  PARTIAL/UNSUPPORTED enumeration statuses; the candidate treats unsupported as an
  UNKNOWN cause (lines 320-323), so the four-value list may be internally defensible —
  but it silently diverges from the constitution's five-outcome wording.
- **Evidence**: VERIFIED — kickoff lines 60-61, 108; constitution 195-196, 207-209;
  candidate 320-323.
- **Disposition**: addressed in Stage A chapter `b0-lens.md` (resolver outcome
  enumeration must either restore "unsupported" as distinct or define it as a coded
  cause inside UNKNOWN); **proposed spine edit** to reconcile the constitution wording
  so two enumerations do not persist.

### IF-09 — The unconditional bytes32 gate pre-judges bakeoff axis 2 / V2-E1 (NOTE)

- **Claim**: "Preserve full-width bytes32 PrincipalId through every ABI" presupposes
  the uniform-Principal surface that axis 2 and V2-E1 keep open — for the tagged
  Account arm (160-bit address) the gate cannot hold as written; the constitution
  carries the same internal tension (146-148 unconditional vs 140-144 "part of the
  prototype, not constitutional law"). Readable consistently only if scoped to
  "Principal-bearing" paths.
- **Evidence**: PLAUSIBLE (all quotes VERIFIED) — kickoff 97-98, 73-74; inbox V2-E1
  lines 19-24; constitution 140-148.
- **Disposition**: addressed in Stage A chapter `b0-principal-authority.md` — scope the
  gate explicitly (binds wherever a PrincipalId appears, both arms; the tagged-arm
  sketch must show its Account tag cannot be confused with a truncated PrincipalId).
  Note: the Stage A B0 arm pins adopt uniform PrincipalId as the baseline; the tagged
  arm stays a sketched bakeoff alternative, so the gate must not silently retire it.

### IF-10 — Baseline automatic reads missing from the costed measurement list (NOTE)

- **Claim**: the kickoff's aggregate-measurement list omits the mandatory baseline
  reads: global admission-order pagination, unique-Records-by-Type, and
  Occurrences-by-Type/Record enumeration.
- **Evidence**: VERIFIED — constitution 168-171; candidate line 269; kickoff 102-107
  (the five adopted generic outcomes map exactly; these do not appear).
- **Disposition**: addressed in Stage A chapter `b0-indexes.md` (the reads exist in the
  index design) and Stage A deliverable 5 (harness matrix must cost admission-order
  pages under decades of churn, Records-by-Type, Occurrences-by-Type/Record/Principal —
  the mandatory bundle, not just the adopted outcomes).

### IF-11 — 50 GB fixture omits funding and durability grades (NOTE)

- **Claim**: the kickoff's 50 GB fixture drops the Large-content acceptance trace's
  "funding and durability grades" element (constitution line 314); the What-to-solve
  list has only the bare word "durability" (kickoff line 64).
- **Evidence**: VERIFIED — constitution 314; kickoff 137-138, 64.
- **Disposition**: addressed in Stage A chapter `b0-content-locators.md`
  (durability/funding-grade evidence Records as generic Types, per the candidate's
  Locator/availability distinction) or an explicit deferral noted there.

### IF-12 — Novel kickoff scope with no spine home (NOTE)

- **Claim**: (a) the five-label taxonomy appears in no spine doc (constitution uses a
  five-tier source-precedence list, lines 22-28); (b) the kickoff standards list adds
  EIP-4337/6492/8130, RFC 6920, RDF/RDFC, deterministic CBOR, multihash, absent from
  all spine docs; (c) a "crypto/identity" reviewer is added, absent from README step 4
  and constitution freeze step 4 — and the constitution's own reviewer list (329-330)
  omits "privacy" which README (101) and kickoff both include (spine-internal
  inconsistency); (d) output 7 "abort conditions" has no spine counterpart.
- **Evidence**: VERIFIED absences — kickoff 39-41, 149-153, 171-172, 165.
- **Disposition**: honored as PM additions in Stage A (label taxonomy is mandatory
  across all chapters); **proposed spine edit** — back-port the label taxonomy, the
  privacy + crypto/identity reviewer set, and the abort-conditions output into
  constitution/README so kickoff and spine stop diverging.

---

## B. Survivor-inventory findings (assumptions-and-requirements register vs kickoff)

### IF-13 — Strong survivor clusters are well exercised (NOTE — affirmation)

- **Claim**: the kickoff exercises the strongest surviving clusters well: full-width
  principals (R-D2 verbatim collision gate), R-D1/D7 replay/carriage vectors, R-M2/D3
  state-readable reconstruction, R-L5/D-9 index/gas gates, R-X2/X3/L6 basis gates,
  R-K3/K9/K11 attacks, R-P1/P5/P6/P7/P9 privacy fixture rows, adopted R-O10 mount; the
  correction banner is handled correctly (envelope/kinds/Type identity/lens grammar
  re-litigated as bakeoff axes, not baselines).
- **Evidence**: VERIFIED — row-to-gate mapping cited in detail in the audit (kickoff
  94-116, 133-140 vs register rows; register lines 10-15 banner).
- **Disposition**: addressed in Stage A deliverable 3 (traceability) — cite this
  row-to-gate mapping rather than re-arguing the clusters.

### IF-14 — Succession/cryptographic-renewal cluster silently lost (SERIOUS)

- **Claim**: the entire succession/renewal cluster (R-K10 "algorithm succession never
  creates an undisclosed mutable global administrator", R-K12 "exactly one active
  kernel at a basis… keeps old receipts verifiable", R-M3, O-3 "schedule cryptographic
  transition before old primitives fail", D-7) has no kickoff bullet, gate, fixture, or
  output — the largest silent-loss risk for a Core intended to "eventually freeze for
  outside data". ERC-7913 appears only as an account-signature standard, not a
  succession path.
- **Evidence**: VERIFIED absence — no occurrence of succession/renewal/post-quantum/
  signature-suite transition in the kickoff; register lines 147, 180, 182, 273,
  449-453.
- **Disposition**: addressed in Stage A chapter `b0-principal-authority.md` (signature-
  suite succession seam) and Stage A deliverable 4 (threat matrix rows: "old suite
  becomes forgeable", "two kernels both admit") and deliverable 7 (named
  deferred-but-reserved seams: R-K10/R-K12/D-7 so the freeze posture cannot be
  evaluated without them); **proposed spine edit** adding the cluster to the kickoff's
  attack list.

### IF-15 — Constitutional lens-scale benchmark (50/100/256) missing (SERIOUS)

- **Claim**: R-L4/A-7/D-10 (50-principal normal case; 256 as measured unknown; §15 line
  595 demands the 50/100/256 benchmark "even if the fixed-domain profile is preferred")
  has no kickoff benchmark; the only lens fixture uses two Principals; "50" appears
  only as 50 GB and 50-year.
- **Evidence**: VERIFIED absence — kickoff 64, 104-107, 137, 177; register 203, 250,
  466-469, 595.
- **Disposition**: addressed at Stage-A interface level in deliverable 5:
  `harness-and-fixtures.md` keeps the contract/Core grid `N={1,8,32,64}` and separately
  specifies the TS/RS client-tier grid `N={50,100,256}` on pinned mobile and desktop
  profiles, reporting wall time, peak memory, RPC/page count, result equality, and honest
  `UNKNOWN`/`PARTIAL` propagation. Register entry HY-3 remains the design-center
  hypothesis. Measurements are Stage B evidence; Stage A claims only the frozen
  interface.

### IF-16 — R-D9 time/order semantics unvectored; §12.7 equivocation correction uncarried (SERIOUS)

- **Claim**: R-D9's freeze-sensitive semantics (author-controlled order is not nonce or
  chronology; claimedAt is testimony; admittedAt is venue-relative) have no kickoff
  vector — the kickoff never mentions order/claimedAt/admittedAt/clocks (bakeoff 7's
  "stable ordinals" is a storage-posting encoding, not author ordering); and §12 item 7
  (register line 533) **removed** the same-(principal, order) equivocation rule — a
  semantic the greenfield record model must consciously re-decide, not inherit or
  forget.
- **Evidence**: VERIFIED absence — kickoff full-text; register 163, 533.
- **Disposition**: addressed in Stage A chapter `b0-authorship-envelope.md` (ordering/
  time-testimony semantics re-decided explicitly, per register OR-1's note) and Stage A
  deliverable 6 (golden-vector categories: misleading claimed times, same-author
  same-order multiplicity, admission-time vs claimed-time divergence).

### IF-17 — §10 grade axis risks compression into presence vocabulary (NOTE)

- **Claim**: the §10 authorization/freshness grades (PORTABLE-EVIDENCE /
  AUTHORITY-ADMITTED / SNAPSHOT@H / CURRENT@H / FOREIGN-LOCAL; "never compress to a
  Boolean valid") are only partially carried by FOUND/ABSENT/CONFLICT/UNKNOWN — a
  presence axis, not an authorization-basis axis; nothing in the kickoff forbids the
  collapse.
- **Evidence**: VERIFIED text, PLAUSIBLE risk — kickoff 60-61, 108-111, 51; register
  378-392, 189, 178.
- **Disposition**: addressed in Stage A chapter `b0-lens.md` (result model carries two
  orthogonal axes) with register entry DI-14; Stage A deliverable 3 traceability shows
  R-X2/R-K8/§10 mapping onto both axes.

### IF-18 — Lens determinism (R-L1/R-L3) has no covering vector class (NOTE)

- **Claim**: the golden set includes page keys but no Lens/Resolution-Plan encodings,
  no differential-compiler corpus, no cycle/diamond/limit adversarial corpus; the
  determinism requirement is grammar-independent and currently ungated.
- **Evidence**: VERIFIED absence — kickoff 93-96; register 200 (Rust/TypeScript
  differential vectors), 202 (adversarial compiler corpus), 586.
- **Disposition**: addressed in Stage A chapter `b0-lens.md` (contract-visible plan
  encoding's canonical bytes join the cross-language golden vectors) and Stage A
  deliverable 6 (minimal adversarial corpus: cycle, duplicate source, limit overflow).

### IF-19 — R-D8 relayer/paymaster substitution vectors missing (NOTE)

- **Claim**: the kickoff covers the account-adapter side (EIP-7702 classification,
  smart-account code changes) but not the sponsorship/relay side — no relayer,
  paymaster, or sponsor substitution vectors, despite R-D8's acceptance evidence
  requiring them ("authority never derives from msg.sender, a relayer, paymaster,
  wallet vendor, or submission rail"; the EIP-8130 note at register line 165 reinforces
  it).
- **Evidence**: VERIFIED absence — kickoff 112-116, 150; register 162, 165.
- **Disposition**: addressed in Stage A chapter `b0-authorship-envelope.md` (the same
  portable envelope submitted by a different rail/sponsor must produce identical
  authorship and identity; a rail must never mint or alter authorship) and Stage A
  deliverable 4 (attack list rows).

### IF-20 — Out-of-scope survivors need naming as reserved seams (NOTE)

- **Claim**: legitimately out-of-scope requirements will be silently lost unless output
  7 names them: R-K6 (identity/funds/encryption recovery separation), R-P3/R-P8
  (recoverable-vs-shreddable tiers; envelope/KEM lifecycle), R-X5/R-X7
  (foreign-contract adapter; local-commitment disclosure), R-O8 (pending/outbox never
  masquerades as confirmed — an SDK-side truth boundary), E-2 (inclusion despite
  censoring relayers, deferred with venue selection).
- **Evidence**: PLAUSIBLE (scoping inference over VERIFIED absences) — kickoff 57,
  133-136, 37, 58, 166; register 215, 503-509, 192, 194, 234, 261.
- **Disposition**: addressed in Stage A deliverable 7 (enumerate these row IDs as
  reserved seams with the design property each must not foreclose — e.g. the additive
  recovery path keeps identity, funds, and encryption roots separable per R-K6); E-2
  **deferred to V2-E7** (venue selection); R-P3/P8 partially carried via register DI-9.

### IF-21 — Register §9/§17 superseded; D-2/D-5 disposition unverified (NOTE)

- **Claim**: the correction banner demotes the register's own §9 "Prototype Option B
  first" and §17 fixed-authority-domain first-prototype hypothesis; the kickoff's
  owner-ratified Realm/no-venue frame supersedes them in the opposite direction —
  Fable must not inherit §17 as the target architecture; and whether D-2/D-5
  (sovereignty) are formally adopted in owner-rulings.md is inference, not verified.
- **Evidence**: VERIFIED texts, PLAUSIBLE disposition — register 353, 628-644, 10-15,
  409-418; kickoff 36-38, 51, 95, 101-103, 115, 5.
- **Disposition**: the fixed-domain §17 prototype target is superseded by the
  2026-08-12 greenfield Realm direction; this is supersession, not an explicit D-2/D-5
  ledger answer. No named venue is selected in Stage A. R-K11 remains the live
  invariant: every authority/currentness result is Realm-qualified, and two Realms
  cannot both claim unqualified `CURRENT`. No owner mechanism decision is requested now.

---

## C. Owner-rulings findings (owner-rulings.md vs spine)

### IF-22 — Item F equivocation ruling silently dropped from the entire spine (SERIOUS)

- **Claim**: the ratified limitation wording, the TOCTOU argument, and the
  challenge-window rule appear nowhere in kickoff, constitution, candidate, or README —
  grep returns zero hits for equivocat*/challenge-window/TOCTOU/collision bit/
  duplicity; only fragments survive ("conflict" resolver outcome; risk-bearer rule);
  the attack list has "authority backdating" but not timed equivocation. The TOCTOU
  argument is mechanism-independent and survives the greenfield reset at requirement
  level, yet the requirements synthesis omits it entirely.
- **Evidence**: VERIFIED — owner-rulings.md:51, :53, :67; constitution 193-196, 200;
  kickoff:61, 113-116.
- **Disposition**: carried as register entry **OR-1** (standing ruling + derived
  TOCTOU argument, with the PM directive's preservation default); addressed in Stage A
  deliverable 4 (threat/falsifier matrix rows: "timed equivocation against contract
  gates / duplicity-bit TOCTOU") and Stage A chapters `b0-binding.md` /`b0-lens.md`
  (conflict-state semantics against the ruling); **proposed spine edit**: add the
  non-guarantee + challenge-window rule to the constitution under "Lenses for contracts
  and people", restating the ratified wording verbatim.

### IF-23 — Chains-don't-die assumption uncarried and mis-scoped for fresh L3s (SERIOUS)

- **Claim**: the adopted assumption ("a blockchain persists indefinitely and stays
  queryable") is carried nowhere in the spine, and its original one-home-chain scope no
  longer matches the fresh-L3/multi-Realm architecture — Realm-death behavior is
  undefined and per-Realm extension was never ruled. The pruning half IS carried
  (constitution 210-213); the assumption boundary is not.
- **Evidence**: VERIFIED — owner-rulings.md:11, :16, :185-188; grep zero hits across
  four spine docs; constitution 210-213. PLAUSIBLE consequence: reviewers reintroduce
  dead-chain hedging or silently extend the assumption.
- **Disposition**: carried as register entry **OR-2**; **resolved in method by PM
  directive** ("Do not reopen broad dead-chain survival machinery. Define
  qualifying-Realm assumptions and honest behavior when a source basis is
  unavailable", directive line 22). A2 is the sole proposed spine location; Stage A
  asks no decision now, and the chapter behavior remains honest under either scope
  answer.

### IF-24 — Kickoff's own text omits the no-writer-opt-out mandate (NOTE)

- **Claim**: the strongest anti-cost-cutting ruling ("MANDATORY automatic indexing; EAS
  opt-in REJECTED (bundle-wide)"; "an individual writer cannot opt out and create
  invisible half-presence") is discoverable only via linked docs; the copy-ready
  kickoff says only "a graph/database index contract Type creators can declare safely"
  and nothing forbids writer-optional indexing as a gas lever. Mitigation: the
  return-to-James rule is carried, and owner-rulings is required reading #2.
- **Evidence**: VERIFIED — owner-rulings.md:59-60, :204-208; constitution 171-174;
  candidate 290-291; kickoff:63-64, 104-107.
- **Disposition**: carried as register entry **OR-3** (writer-opt-out indexing
  classified [REJECTED]); addressed in Stage A chapter `b0-indexes.md` (cost levers
  limited to Type-creator-declared index scope or return-to-James); **proposed spine
  edit**: state the mandate in the kickoff's own gate text.

### IF-25 — Candidate lacks mechanisms for two costed obligations: revocation-aware counts and best-locator selection (NOTE)

- **Claim**: constitution 180-184 and kickoff 104-106 carry both as costed gates, but
  the candidate's index section (266-279) contains no counter maintenance and no
  locator-selection primitive — generic postings give enumeration, not revocation-aware
  bounded counts. Original strength: owner-rulings.md:49 "Do NOT ship advisory only …
  PAY for it." Not a spine drop; a candidate gap — the attackable candidate is silently
  thinner than the obligation set.
- **Evidence**: VERIFIED — constitution 180-184; kickoff 104-106; candidate 266-279;
  owner-rulings.md:49.
- **Disposition**: addressed in Stage A chapters `b0-indexes.md` (counter maintenance
  design, costed) and `b0-content-locators.md` (deterministic best-locator selection
  primitive); budget failure follows the OR-4 return-to-James path — required design
  work, not scope the candidate already cut.

### IF-26 — Persona/unlinkability expressibility missing from extension requirements (NOTE)

- **Claim**: opt-in unlinkable personas (adopted July capability) are absent from the
  constitution's authority extension list (137-139) and everywhere else in the spine;
  the KEL persona mechanism is rightly superseded, but the requirement-level lesson
  (opt-in personas + one-place management/recovery UX stay expressible) is a survivor
  the synthesis does not carry.
- **Evidence**: VERIFIED absence — constitution 137-139, 249; owner-rulings.md:73, :90,
  :180-183.
- **Disposition**: carried as register entry **OR-7**; addressed in Stage A chapter
  `b0-principal-authority.md` (axis-2 probe: "can one root manage multiple unlinkable
  account Principals later?"); **proposed spine edit**: add personas/unlinkability to
  the extension-requirements list or record explicit deferral with a pointer.

### IF-27 — The 2026-07-22 four-tier support matrix was never produced or retired (NOTE)

- **Claim**: owner-rulings.md:121 requires "the short constitution and explicit support
  matrix… distinguish[ing] required, extension-ready, experimental, and explicitly
  unsupported behavior"; the constitution exists but offers only "What is deliberately
  not frozen" (283-295); kickoff output 7 is the nearest analogue; no ruling supersedes
  the matrix deliverable.
- **Evidence**: VERIFIED — owner-rulings.md:121; constitution 283-295; kickoff:165.
  PLAUSIBLE that the greenfield reset re-sequenced it.
- **Disposition**: addressed in Stage A deliverable 7 — produce the four-tier support
  matrix (it maps naturally onto output 7 plus the traceability table) **or** flag it
  for explicit retirement in owner-rulings; silent lapse is what the 7-16 META ruling
  on missed artifacts was meant to prevent.

### IF-28 — "Universal deterministic IDs" traceable only by reference (NOTE)

- **Claim**: the kickoff's owner-ratified frame lists it, but owner-rulings.md's own
  2026-08-12 obligation list never mentions deterministic IDs — the ratification lives
  in Decisions.md:21 ("Universal deterministic EFS identities remain required", @james
  2026-08-08), incorporated by reference; an audit relying on owner-rulings alone would
  flag attribution inflation.
- **Evidence**: VERIFIED — kickoff:38; owner-rulings.md:176-177, :184-188;
  Decisions.md:21.
- **Disposition**: no kickoff change needed (register entry **OR-5** cites
  Decisions.md:21 directly); **proposed spine edit** (low priority): inline the Aug-8
  sentence or the citation when owner-rulings is next touched, so the append-only
  ledger is audit-self-sufficient.

### IF-29 — No accidental survivals of superseded mechanisms; carriage otherwise faithful (NOTE — affirmation)

- **Claim**: requirement-level rulings trace cleanly (no-body-elision; the five costed
  query obligations; contracts-read-public-only; public-by-default + sensitivity
  inheritance; three-host read-only mount incl. xattrs-not-canonical; GitHub-class
  expressibility; support-for-every-chain-not-required), and no superseded mechanism
  survives: no home-chain-authoritative language anywhere; MAX_LENSES=20 gone (the
  1/8/32/64 benchmarks cover the 50+-attester concern); the candidate's
  Envelope/Occurrence resemblance to the July round is explicitly held open as bakeoff
  axes 1/3; EAS consistently demoted to optional adapter.
- **Evidence**: VERIFIED with full citation map — constitution 210-213, 180-184, 244,
  242-243, 254-255, 267-274, 316, 311, 59-62, 327-328; kickoff 83-84, 104-106,
  126-128, 139-140, 143-144, 70-75; candidate 154-159, 172-174; owner-rulings.md:26-27,
  :111, :187-188.
- **Disposition**: addressed in Stage A deliverable 3 — cite this mapping in the
  traceability table rather than re-deriving it; the constitution's requirement
  carriage is sound **except** the IF-22 and IF-23 gaps.

---

## D. Bakeoff-structure findings (axis lattice, confounds, decision statistics)

### IF-30 — Axis 5 is nested inside axis 1; "vary each axis independently" is unsatisfiable for the axis-1 flip (SERIOUS)

- **Claim**: axis 5 (inline vs RecordId leaves) exists only under axis 1's
  shared-Envelope arm — under self-contained headers there is no Envelope and no leaf
  to encode; the valid design space is 2^6 + 2^5 = **96 cells, not 128**; the axis-1
  flip cell is by necessity compound (flips axis 1 AND collapses axis 5).
- **Evidence**: VERIFIED — kickoff 73-74, 79-80, 71; candidate 171-174, table line 409.
- **Disposition**: addressed in Stage A deliverable 4 (bakeoff specification): amend
  the instruction rather than silently comply — declare F1's confound explicitly; never
  present F1-vs-B0 deltas as a pure axis-1 main effect where leaf encoding contributes
  (calldata, extraction).

### IF-31 — Axis 3's portable arm presupposes axis 1's Envelope; F1 needs a specified re-expression (SERIOUS)

- **Claim**: AdmissionIntent.occurrenceRefs and Occurrence identity are defined as
  (EnvelopeId, leafIndex), so a naive axis-1 flip silently drags axis 3 along; the
  portability question is conceptually re-expressible under self-contained headers
  (portable header + separate intent keyed to the record-instance ID) but no document
  specifies that re-expression.
- **Evidence**: VERIFIED — candidate 143-149, 176-177; PLAUSIBLE — the re-expression.
- **Disposition**: addressed in Stage A deliverable 4 (F1 cell spec re-expresses axis 3
  arm A and holds it at the baseline arm) with the occurrence-identity definition owned
  by Stage A chapter `b0-authorship-envelope.md`.

### IF-32 — Eighth bakeoff row would silently drop out of a kickoff-built harness (NOTE)

- **Claim**: duplicate anchor of IF-04 from the bakeoff lane — the "Type schema
  identity: publisher-qualified namespace vs semantic spec commitment" row maps to no
  kickoff axis and is decided by no gas or vector measurement.
- **Evidence**: VERIFIED — kickoff 73-84; candidate 407-416, line 413, line 73.
- **Disposition**: as IF-04 — analysis-only row in the bakeoff specification, decided
  by written analysis plus golden vectors (two publishers hashing the same spec text),
  recorded so the row is not lost.

### IF-33 — Five axis pairs interact through measurement: 1×7, 1×2, 4×7, 3×5, 6×7 (SERIOUS)

- **Claim**: even where semantically independent, these pairs share measured totals:
  axis-7 posting cost sits inside the aggregate calldata/SSTORE totals that decide axis
  1; the axis-2 tagged union appears once per Record (self-contained) vs once per
  Envelope (shared); Variant-B backfill cost depends on the axis-7 encoding;
  subset-carriage vectors behave differently for inline vs RecordId leaves; ordinal
  assignment couples a shared counter across the Admission/Index module boundary.
  PLAUSIBLE: that these are the only strong interactions.
- **Evidence**: VERIFIED components — candidate 412, 281-287, 409, 134-141, 294-298,
  158, 349-355; kickoff 102-104, 97.
- **Disposition**: addressed in Stage A deliverable 4: exactly one interaction cell X17
  "FLATCARD-WIDE" (1×7 is the one interaction whose sign could flip the axis-7
  verdict); 1×2 recovered by arithmetic (repetition count × tagged-union byte delta
  from F1/F2); 4×7 measured on baseline ordinals with the RecordId delta computed from
  F7; subset-carriage suite run in both F3 and F5; 6×7 treated as analysis (RecordId
  postings remove the shared-counter coupling ordinals impose on the modular arm).

### IF-34 — Proposed baseline: B0 "SPINE" = the candidate document's own configuration (NOTE)

- **Claim**: make every flip cell a direct attack on one claim of the candidate: shared
  Envelope (1B), uniform PrincipalId + intrinsic account Principal (2B), portable
  Envelope + AdmissionIntent (3A), Type Variant A single TypeSchemaId (4A), inline
  Record leaves (5A), one atomic Core with internal-library modules (6A), packed
  stable-ordinal postings (7B). Axis 4 and 5 baselines are auditor choices of
  convenience, not endorsements — both variants still get built.
- **Evidence**: VERIFIED alignment — candidate 259 ("Bakeoff baseline"), 21-34,
  155-158, 358-360, 282; PLAUSIBLE — the axis-4/5 convenience choices (candidate 88-95
  refuses to choose; inline leaves trivially satisfy the one-call gate, kickoff 56).
- **Disposition**: **adopted as the Stage A B0 "SPINE" arm pins** (the lane task
  statement's axis 1-7 pins match this configuration exactly); the bakeoff
  specification must state which arms are candidate-ratified vs auditor-chosen, per the
  finding's own recommendation; satisfies kickoff line 30's framing of the candidate as
  "a disposable candidate to attack".

### IF-35 — Proposed fractional design: 9 cells replace the 96-cell lattice (NOTE)

- **Claim**: B0 (SPINE), F1 "FLATCARD" (self-contained; declared compound: axis 5
  collapses, axis 3 re-expressed at baseline), F2 "TAGGED" (thin ABI variant on B0's
  engine), F3 "REALMBOUND" (realmId inside the signed Envelope, no separate intent), F4
  "SPLIT-ID" (Type Variant B + coverage state machine), F5 "REF-LEAF" (RecordId leaves
  + same-tx availability), F6 "MODULAR" (six physical contracts), F7 "WIDE-POST" (full
  RecordId postings), X17 "FLATCARD-WIDE". Only ~4 distinct engines (B0, F1/X17, F4,
  F6); F2/F3/F5/F7 are small code deltas — build as separate lean branches, NOT one
  runtime-parameterized engine, or abstraction overhead pollutes every gas number.
- **Evidence**: PLAUSIBLE design proposal grounded in verified structure — kickoff 71,
  86-87; the additivity defense rests on IF-33's handling.
- **Disposition**: addressed in Stage A deliverable 4 (adopt the 9-cell matrix with
  per-cell declared confounds in the harness README; freeze one fixture corpus and
  workload script set across all cells before any cell is measured).

### IF-36 — Axis 1 decision statistics (NOTE)

- **Claim**: decide by crossover batch size k* (Envelope beats self-contained), the k=1
  premium ratio, and a pass/fail state-only reconstruction gate; measure total gas for
  k = 1, 3, 10 Records in B0 and F1 across the Arcade and Git traces. Envelope survives
  only if k* ≤ median fixture batch size AND both arms pass state-only reconstruction;
  if Envelope loses at k=1 by more than batch savings recoup, self-contained wins —
  return the tradeoff per kickoff 106-107.
- **Evidence**: VERIFIED grounding — candidate 409, falsifier 10 (line 432); kickoff
  102-104; PLAUSIBLE — the decision form.
- **Disposition**: addressed in Stage A deliverable 4 (bakeoff spec, axis-1 falsifier);
  fixture corpus owned by deliverable 5.

### IF-37 — Axis 2 decision statistics: four of five results need no gas prototyping (NOTE)

- **Claim**: decided by setup-tx count before first write, per-write
  authority-verification gas delta, author-enumeration keyspace count, the graduation
  vector (zero rewritten historical Occurrences), and the EIP-7702 classification
  vector. Uniform PrincipalId adopted iff setup txs = 0, graduation passes, 7702
  classifies under the versioned verifier, and the per-write delta is within noise;
  tagged wins iff uniform fails any; tagged itself rejected if author enumeration
  probes two keyspaces (fractured portable EOA authorship). F2 is a thin variant, not a
  full cell.
- **Evidence**: VERIFIED — candidate falsifier 1 (line 422), 259-263, 247-250; kickoff
  114; PLAUSIBLE — the gas delta is a computable constant.
- **Disposition**: addressed in Stage A deliverable 4 and Stage A chapter
  `b0-principal-authority.md` (graduation vector, versioned verifier, keyspace
  criterion).

### IF-38 — Axis 3 decision statistics: adversarial matrix with one outright-rejection rule (NOTE)

- **Claim**: if the Realm-bound arm cannot keep copied signed evidence verifiable at a
  destination, it is rejected regardless of gas; intent overhead is tiebreaker only.
  Four-vector matrix in F3 and B0: (1) cross-Realm replay creates no destination truth
  without destination admission; (2) subset carriage of Envelope leaves; (3) domain
  confusion between publication and intent signatures; (4) copied-evidence
  verifiability at destination. If the separate AdmissionIntent overhead breaks the
  aggregate budget, redesign the intent (e.g. same-tx implicit intent) before conceding
  the axis; return the tradeoff per kickoff 106-107.
- **Evidence**: VERIFIED — candidate 155-158, 183-187; kickoff 96-98, 115.
- **Disposition**: addressed in Stage A deliverable 4 and Stage A chapters
  `b0-authorship-envelope.md` (portability rules) / `b0-realm-admission.md`
  (destination-admission rule).

### IF-39 — Axis 4 decision statistics: fracture count vs backfill gas + a hard coverage gate (NOTE)

- **Claim**: script one index-evolution event mid-way through the Git and Arcade
  timelines. Variant B rejected outright if any coverage vector lets a PARTIAL backfill
  answer as complete absence (candidate falsifier 6, line 427); Variant A rejected if
  the evolution event fractures Record dedup badly enough that cross-generation fixture
  queries need equivalence evidence on the hot read path. Backfill gas/record on
  baseline ordinals; RecordId delta computed from F7 (declared 4×7 confound).
- **Evidence**: VERIFIED — candidate 88-95, 294-298, 427, 414.
- **Disposition**: addressed in Stage A deliverable 4 and Stage A chapter
  `b0-encoding-and-ids.md` (TypeSchemaId variants); the coverage state machine rides
  `b0-indexes.md`.

### IF-40 — Axis 5 decision statistics: one-call gate + endorsement crossover; dedup out of scope (NOTE)

- **Claim**: the RecordId-leaf arm must demonstrate Project+Release+Locator with
  dependent references admitted in ONE transaction (bundled body bytes or pre-admitted
  Records) — failure is decisive for the write path. Then measure calldata per
  admission for fresh-unique publication (favors inline) vs the 10-curator
  re-endorsement trace (favors RecordId leaves); decide by fixture endorsement
  frequency. Storage dedup explicitly out of scope: bodies are state-readable under
  both arms. Subset-carriage vectors run here as well as in F3 (declared 3×5
  interaction).
- **Evidence**: VERIFIED — kickoff 56; candidate 171-174, 179-181, 415.
- **Disposition**: addressed in Stage A deliverable 4 and Stage A chapter
  `b0-authorship-envelope.md` (leaf encoding + one-call dependent-write path).

### IF-41 — Axis 6 decision statistics: the code-size gate is compile-time and comes first (NOTE)

- **Claim**: runtime bytecode size against the EIP-170 limit is a compile-time forced
  gate — compile B0 in week one; if the monolith exceeds the intended profile's limit
  the axis is decided (modular or split forced) before any bakeoff runs. Otherwise
  decide by F6's per-admission module-boundary gas overhead and a pass/fail adversarial
  matrix (reentrancy across modules, partial commit, malformed returndata) where any
  partially-committed Core write rejects or forces redesign of the modular arm.
- **Evidence**: VERIFIED — candidate 411, 349-361, 352-353; kickoff 112-113; PLAUSIBLE
  — that EIP-170's 24,576-byte limit is the relevant bound on the intended L2/L3
  profile (candidate falsifier 14, 436-438). Standards status: standards-audit §2.14
  (EIP-7907 did not ship; the limit stands).
- **Disposition**: addressed in Stage A deliverable 4 (bakeoff spec; week-one
  compile-gate ordering) — the atomic-Core arm is the pinned B0 axis-6 baseline, so
  this gate is on Stage A's critical path.

### IF-42 — Axis 7 decision statistics: exhaustion is arithmetic; do it now (NOTE)

- **Claim**: three decision numbers — amortized gas per posting append, gas per
  100-item page read including the ordinal→RecordId dereference, and 2^width ÷ a
  credible sustained L2 write rate (pure arithmetic; likely eliminates narrow widths by
  analysis alone: uint32 vs uint48 vs uint64 at a stated writes/second assumption).
  Packed ordinals can share slots; each RecordId posting costs a full 32-byte slot.
  Decide by fixture read/write ratio; confirm the verdict's sign in X17 before
  adopting, since posting cost sits inside the totals that decide axis 1.
- **Evidence**: VERIFIED — candidate 412, 281-287, 289-292; kickoff 84, 104-105;
  PLAUSIBLE — the decision form.
- **Disposition**: addressed in Stage A chapter `b0-indexes.md` (ordinal width
  arithmetic, posting layout) and Stage A deliverable 4 (F7/X17 cells).

### IF-43 — Four questions need no prototype cell (NOTE)

- **Claim**: analysis-only deliverables with named acceptance criteria: the eighth
  Type-schema-identity row (governance/identity argument — no measurement
  discriminates); axis 7's exhaustion component (arithmetic); axis 6's code-size gate
  (compile-time); most of axis 2 (thin variant plus vectors, rejection conditions
  checkable by inspection). Shrinks real engineering to roughly four distinct engines
  across 9 cells — directly serving the kickoff's "smallest architecture we could
  responsibly prototype" framing (kickoff 14-16).
- **Evidence**: VERIFIED — candidate 413, 412, 411, 261-263; PLAUSIBLE — the judgment
  that no dedicated prototype arm is required.
- **Disposition**: addressed in Stage A deliverable 4 (the bakeoff spec moves these out
  of the prototype matrix into written-analysis deliverables).

### IF-44 — Axis-invariant subsystems build once on B0; fixture corpus frozen first (NOTE)

- **Claim**: Binding/CAS/withdrawal/no-resurrection (candidate 217-236) and
  ResolutionPlan point resolution (303-319) appear in no bakeoff row; the
  1/8/32/64-Principal Plan benchmark (line 450) names no axis dependency; build them
  exactly once on B0 with per-cell adapters only where occurrence identity differs
  (F1/X17 — the Binding predecessorOccurrence field, line 220, needs IF-31's
  re-expression); run the Plan benchmark once on B0; freeze the fixture corpus and
  workload scripts (spam, churn, hot-value workloads; kickoff 104-105, 120-144) before
  the first measurement so every cross-cell delta is attributable to its flipped axis.
- **Evidence**: VERIFIED — candidate 217-236, 303-319, 407-416, 450, 220; kickoff
  120-144; PLAUSIBLE — full invariance of Binding under axis 1.
- **Disposition**: addressed in Stage A chapters `b0-binding.md` (built-once subsystem)
  and `b0-lens.md` (point resolution), and Stage A deliverable 5 (frozen fixture
  corpus + workload scripts as harness interface).

---

## E. Carry-in routing meta-finding

### IF-45 — Mechanism-level prior results appear nowhere in the spine (BLOCKING)

- **Claim**: the spine carries lens/KEL/privacy/on-chain-completeness results only at
  requirement level; none of LR-1/LR-2/LR-3, the EIP-7825 page physics, the CREATE2
  plan store, the four absence sources, the 6+1 axes appear in any spine doc — the deep
  pass will rediscover or contradict them unless routed explicitly as labeled evidence,
  with each kickoff axis bound to its evidence doc (Lens/graph-index axes → lens-spec +
  lens-pass-synthesis, critic ledger wins over lane text; Principal/authority axis →
  kel.md §3/§7-§9; privacy fixture → privacy-pass-synthesis PC-5/PC-7/PC-11). Nothing
  lens- or KEL-derived is owner-ratified.
- **Evidence**: VERIFIED — grep over Designs/efsv2/*.md; owner-decision-inbox LP-1…
  LP-10 (~208-252); kickoff 33-34.
- **Disposition**: **addressed by this corpus** — `carry-in-register.md` is the labeled
  routing map (OR/DI/HY/RJ/PR entries with invalidation surfaces); every Stage A
  chapter must cite register IDs for imported mechanisms instead of re-deriving them.

---

## F. Standards-derived spine corrections (cross-reference)

Full FACT/policy entries live in `standards-audit.md`; dispositions here for routing
completeness. Severities as recorded there.

| Correction | Severity | Disposition |
|---|---|---|
| EIP-7825 live; July batch arithmetic stale; kickoff omits it | SERIOUS | register DI-3; arithmetic re-derived wherever batches/pages are bounded — `b0-indexes.md`, `b0-authorship-envelope.md` (batch sizing), harness (deliverable 5); Stage A task text already pins the cap |
| ERC-7913 Final (not future seam) | SERIOUS | addressed in `b0-principal-authority.md` (candidate encoding; verifier-is-Realm-config portability split) |
| EIP-7951 live; passkey Principals buildable | SERIOUS | addressed in `b0-principal-authority.md` (P-256/WebAuthn vector; algoTag path) |
| "Deterministic CBOR" needs a byte-exact profile; CBOR CDE-13 is expired/archived, not an RFC | SERIOUS | addressed in `b0-encoding-and-ids.md` (meta-codec candidates named; golden vectors blocked until pinned); no floating CDE dependency |
| EIP-712 missing; constant-domain deviation must re-earn | SERIOUS | addressed in `b0-authorship-envelope.md` (domain design) + `b0-encoding-and-ids.md` (domain constants) |
| ERC-1271 live vault contradiction (July "never" vs candidate "locally") | SERIOUS | addressed in `b0-principal-authority.md` (admission-time only, basis-pinned receipts; never read/Lens paths); register RJ-3 caveat |
| CAIP-2/10 + ERC-7930 chain-reference encoding missing | SERIOUS | addressed in `b0-realm-admission.md` (RealmId preimage encoding; Codex-pinned if 7930 adopted while Review) |
| ERC-6492 unsafe as admission-time basis | NOTE | addressed in `b0-principal-authority.md` (pre-flight only, or deployment-state basis in receipt) |
| EIP-8130 Draft — falsifier probe only | NOTE | addressed in `b0-principal-authority.md` (verifier-abstraction probe; no dependency) |
| EIP-170 binding on axis 6; EIP-4444/EIP-7927 are Stagnant documents while pre-merge-history expiry is partially deployed | NOTE | IF-41 (compile gate); `b0-indexes.md`/`b0-realm-admission.md` (state-readable reconstruction justified by separately cited deployment direction); **proposed spine edit** (standards list) |
| multihash registry-only; 6860-vs-4804; Git transition; RFC 6920; RDFC; SWHID; DID; ERC-5564; EIP-1153/2935/7201 | NOTE | addressed in `b0-encoding-and-ids.md` (Codex-pinned code subsets, ByteDigest foreign digests) and `b0-content-locators.md` (web3:// pinning, locator conventions); remainder are standards-audit policy entries awaiting chapter adoption |

---

## Interfaces exposed

- Findings are citable as IF-01…IF-45; severity and VERIFIED/PLAUSIBLE marks are the
  intake auditor's and may not be weakened downstream (red-team check).
- The disposition column is the Stage A coverage contract: every "addressed in" claim
  is verifiable against the named chapter file; every "proposed spine edit" must appear
  in deliverable 7's edit list; every "deferred to V2-En" must appear in the
  gate-coverage map (IF-06).
- Open owner decisions surfaced after evidence: the counter-vs-advisory bundle decision
  after the aggregate gas snapshot (IF-25 / OR-4). A2 remains a sole proposed
  per-Realm-scope location and is not a Stage A decision request; IF-21 is resolved by
  supersession rather than an explicit D-2/D-5 ruling.

## Open items

- The Stage A assembly files are now visible: `traceability.md`, `bakeoff-spec.md`,
  `harness-and-fixtures.md`, `vectors-and-falsifiers.md`, and
  `proposed-spine-edits.md`. Dispositions cite their exact available home rather than a
  hypothetical later synthesis.
- IF-15's client-tier 50/100/256 matrix is frozen in `harness-and-fixtures.md`; it is a
  Stage A interface, not evidence that any measurement has yet run. The Core 1/8/32/64
  grid remains distinct and does not imply a Core cap above 64.
- The spine-internal reviewer-list inconsistency (constitution omits "privacy";
  README/kickoff include it — IF-12c) needs a one-line spine edit decision.
