# Proposed spine edits — Stage A deliverable 7
**Stage A chapter — post-red-team repaired draft; proposals only; not landed.**

This document is PROPOSALS ONLY. No shared design file has been edited, and
nothing here self-adopts: per the PM Stage-A execution defaults
(pm-stage-a-directive.md, 2026-08-12, "Silence never adopts a proposal"), every
item below requires explicit adoption by the named authority before any vault
file changes. Contradictions between spine files are called out inside the
items, satisfying kickoff output 8 ("proposed edits to the current spine, with
contradictions called out before editing shared files" —
fable-efs2-core-engineering-kickoff.md:166-167, VERIFIED).

## How to read this document

Every item carries:

- **Target file** and **Location** (section heading + line numbers as of
  2026-08-12; line numbers are advisory, the quoted old text is authoritative
  for locating the edit).
- **Verbatim proposed text**, as `OLD →  NEW` where replacing, or `INSERT`
  where adding. Proposed text is quoted in fenced blocks exactly as it should
  appear in the target file.
- **Rationale with citation.**
- **Label** — exactly one of: `[OWNER RULING restoration]` (re-carries an
  attributed James ruling the spine silently dropped; cites
  Designs/efsv2/owner-rulings.md date/lines), `[DERIVED INVARIANT restoration]`
  (re-carries a spine/evidence obligation another spine file already states),
  `[PM DIRECTIVE adoption]` (implements a binding PM Stage-A execution
  default), or `[PROPOSAL]` (new design choice of this pass, with rationale).
- **Authority routing**, per Onboarding/authority.md (VERIFIED, read in full):
  only `@james` holds ruling authority (scope `*`); "the gate is on rulings,
  not edits" — agents may perform file edits, but restorations must cite the
  ruling they restore, kickoff changes route through the PM (the kickoff is
  `#kind/prompt`, PM-owned), and owner-rulings.md is James's append-only
  ledger (agents record his rulings; they do not add content on their own
  authority).

Verification key: **VERIFIED** = I read the exact cited text in this pass.
**VERIFIED (lane)** = the intake audit (audit-lanes.json) read and quoted the
exact text; I read the audit, not the underlying file. **PLAUSIBLE** = stated
inference. Standards statuses cite the STANDARDS audit lane, which
web-verified the intake marks on 2026-08-12; its PM-named status corrections were
reverified against primary sources on 2026-08-13.

Items are ordered by target file: A = system-constitution.md, B = README.md,
C = fable-efs2-core-engineering-kickoff.md, D = owner-rulings.md.
**Inventory:** 16 items: A1-A4, B1-B2, C1-C9, D1.

---

## A. Designs/efsv2/system-constitution.md

The constitution is `#status/draft` and states its own correction rule: "When
this draft conflicts with a ruling or promoted EFS 2.0 spec, this draft is
corrected" (system-constitution.md:31-32, VERIFIED). A1 and A3 restore
attributed rulings. A2 is one set-wide [PROPOSAL], informed by historical
owner evidence and the PM's method directive; A4 remains a [PROPOSAL]. No item
self-adopts a new mechanism or scope.

### A1. Equivocation non-guarantee + challenge-window (item F restoration)

- **Target file:** Designs/efsv2/system-constitution.md
- **Location:** section `### Lenses for contracts and people` (lines
  189-203); INSERT a new bullet after the final bullet ("Contract-visible
  Lenses are public. Private personal trust policy stays local/encrypted
  unless a later zero-knowledge profile genuinely proves more.", lines
  202-203).
- **Verbatim proposed text (INSERT):**

```markdown
- On-chain gates use closed, trusted author sets; EFS does not guarantee
  contracts can detect equivocation, and contracts needing certainty against
  untrusted authors must use a challenge-window (delay + re-check) pattern.
  A read-time on-chain collision/duplicity bit is rejected: it is
  TOCTOU-defeated, because it can only reflect equivocation already on-chain
  at read time, a contract that already acted is not retroactively protected,
  and the attacker controls timing. Clients and apps remain able to detect
  equivocation by scanning preserved history; preserving both siblings of a
  conflict is one purpose of full state-readable Record bodies. The exact
  collision-state mechanics — what conflict evidence Core stores, and how a
  resolver derives a `CONFLICT` outcome from it — remain unfrozen and
  evidence-gated.
```

- **Rationale + citation:** The first sentence is the ratified wording
  verbatim-in-substance from owner-rulings.md:51 ("Wording to ratify: *'on-chain
  gates use closed, trusted author sets; EFS does not guarantee contracts can
  detect equivocation, and contracts needing certainty against untrusted
  authors must use a challenge-window (delay + re-check) pattern.'*",
  VERIFIED). The TOCTOU sentence condenses owner-rulings.md:52-53 (the
  recorded mechanism note and James's clinching argument, VERIFIED). The
  siblings sentence carries owner-rulings.md:67 (item 17: full-body spine
  "preserves both siblings for F's equivocation-detectability", VERIFIED).
  The final unfrozen sentence implements the PM execution default
  ("Preserve the equivocation/TOCTOU lesson and challenge-window safety
  requirement, while leaving exact collision-state mechanics unfrozen",
  pm-stage-a-directive.md:21, VERIFIED). The RULINGS audit lane found this
  ruling silently dropped from the entire 2.0 spine — zero grep hits for
  equivocat*/challenge-window/TOCTOU/collision bit across all four spine
  docs (audit-lanes.json RULINGS finding 1, SERIOUS, VERIFIED (lane)).
- **Label:** [OWNER RULING restoration] — owner-rulings.md 2026-07-15, item F
  (lines 51-54); unfrozen-mechanics clause per PM directive 2026-08-12.
- **Contradiction called out:** none — the spine currently says nothing
  either way; the surviving fragments (`CONFLICT` as a resolver outcome, the
  risk-bearer rule) are consistent with this restoration.
- **Authority routing:** PM applies (correction toward an attributed ruling;
  self-authorizing under the constitution's own precedence rule). No new
  James decision required.

### A2. Qualifying-Realm assumptions + honest `UNAVAILABLE_SOURCE_BASIS`

- **Target file:** Designs/efsv2/system-constitution.md
- **Location:** INSERT a new subsection under `## Core constitutional
  requirements`, immediately after `### Universal identity without false
  equivalence` (which ends at line 109) and before `### Minimal typed data`
  (line 111).
- **Verbatim proposed text (INSERT):**

```markdown
### Qualifying Realms and source availability

- EFS assumes a qualifying Realm's chain persists indefinitely and stays
  queryable. Core therefore carries no dead-chain survival machinery: no
  offline verification from dead-chain headers, no chain-mortality tiers, no
  checkpoint-recency-as-death-insurance, and no "graded after the home chain
  is gone" semantics. State-readable full bodies remain required for the
  separate reasons of history pruning (EIP-4444-class log expiry) and
  possible state expiry — chains that live can still prune.
- The persistence assumption is part of what "qualifying" means, and it is
  per-Realm: whoever deploys or adopts a Realm accepts that assumption for
  that Realm. A throwaway devnet or short-lived fork can run Core, but no EFS
  promise survives its operator abandoning it. Deployment diligence, not
  protocol machinery, is the answer to Realm mortality.
- When an answer requires evidence from a source Realm or basis that is not
  currently reachable — an unreachable RPC, a replica missing the required
  range, imported cross-Realm evidence whose source receipt basis cannot be
  consulted — honest behavior is a `UNKNOWN` result carrying the cause code
  `UNAVAILABLE_SOURCE_BASIS`, never absence, never a silently degraded
  default. Consistent with the persistence assumption, unavailability is
  presumed temporary and retryable; clients present it that way.
```

- **Rationale + citation:** The chains-don't-die ruling
  (owner-rulings.md:11-15, "ADOPTED (James): assume a blockchain persists
  indefinitely and stays queryable" with the surgical DROP/KEEP lists,
  VERIFIED) is carried nowhere in the spine — grep for
  die/dead-chain/mortality/queryable returns zero hits across all four spine
  docs (audit-lanes.json RULINGS finding 2, SERIOUS, VERIFIED (lane)). The
  first bullet restores it, including the KEEP half (pruning ≠ death,
  owner-rulings.md:15, VERIFIED). The second bullet answers the audit's
  scope-mismatch point (the ruling was adopted in a home-chain context; the
  fresh-L3/multi-Realm frame makes Realm death realistic) in exactly the
  shape the PM directive orders: "Do not reopen broad dead-chain survival
  machinery. Define qualifying-Realm assumptions and honest behavior when a
  source basis is unavailable" (pm-stage-a-directive.md:22, VERIFIED). The
  third bullet defines that honest behavior and names the cause code other
  Stage A chapters already need (the resolver and cross-Realm chapters
  consume `UNAVAILABLE_SOURCE_BASIS`).
- **Label:** historical chains-don't-die ruling [OWNER RULING evidence] —
  owner-rulings.md 2026-07-10 (lines 10-17); PM method directive
  [PM DIRECTIVE adoption] — `pm-stage-a-directive.md:22`; this complete
  per-Realm scope item is one [PROPOSAL]. The historical ruling and the
  directive inform the item, but neither silently adopts the proposed scope.
- **Contradiction called out:** none in current text (the spine is silent);
  the item replaces silent scope loss with explicit scope.
- **Authority routing:** A2 remains the sole owner-routed scope proposal;
  Stage A does not ask for adoption now. If later promoted, James is the
  authority. The B0 behavior remains honest under either scope answer.

### A3. Personas/unlinkability in the authority extension list

- **Target file:** Designs/efsv2/system-constitution.md
- **Location:** section `### Authorship and authority`, bullet at lines
  137-139.
- **Verbatim proposed text (OLD → NEW):**

OLD (lines 137-139, VERIFIED):

```markdown
- Key rotation, delegation, recovery, organizations, and future signature
  suites remain extension requirements. A full custom KEL is not frozen into
  the MVP merely to reserve them.
```

NEW:

```markdown
- Key rotation, delegation, recovery, organizations, opt-in unlinkable
  personas, and future signature suites remain extension requirements. A full
  custom KEL is not frozen into the MVP merely to reserve them. Personas are
  an opt-in capability, not the default: the mainstream default is one place
  to manage and recover a person's identities, and true isolation remains
  separate roots. The Principal model must not foreclose either; whether
  unlinkable personas are derived from one root or are separate roots grouped
  only in local client state is unfrozen mechanism.
```

- **Rationale + citation:** owner-rulings.md:73 rules "Unlinkable personas
  are an **opt-in capability, not the paranoid default**" with one-place
  recovery/management as the mainstream priority and separate roots as true
  isolation (VERIFIED); owner-rulings.md:90 (2026-07-16 course correction)
  refines the mechanism — durable unlinkable personas cannot share a recovery
  root without relinking, so "manage in one place" means the local OS
  profile, and the derived-stealth hybrid is moot as stated (VERIFIED). The
  proposed text deliberately restores only the requirement level (opt-in
  personas + one-place UX stay expressible) and leaves the mechanism
  unfrozen, which is the correct greenfield carriage per the 2026-08-12
  boundary ruling (owner-rulings.md:178-180, mechanisms re-earn inclusion,
  VERIFIED). The RULINGS audit lane found personas absent from the
  constitution's extension list (audit-lanes.json RULINGS finding 5, NOTE,
  VERIFIED (lane)); its recommendation that the axis-2 Principal bakeoff
  probe "can one root manage multiple unlinkable account Principals later?"
  is carried in item C6 below.
- **Label:** [OWNER RULING restoration] — owner-rulings.md 2026-07-15
  persona ruling (lines 72-79) as corrected by 2026-07-16 (line 90).
- **Contradiction called out:** the constitution's nearest text
  ("Graph-hiding, key-management, and proof profiles remain additive research
  seams", line 249) is about payload privacy, not authorship unlinkability;
  no conflict, but reviewers should not treat it as already covering
  personas.
- **Authority routing:** PM applies (correction toward attributed rulings).

### A4. One resolver outcome enumeration + two-axis result honesty

- **Target file:** Designs/efsv2/system-constitution.md (primary), with two
  consequential edits in core-architecture-candidate.md and
  fable-efs2-core-engineering-kickoff.md so one vocabulary exists spine-wide.
- **Location (primary):** section `### Lenses for contracts and people`,
  bullet at lines 193-196.
- **Verbatim proposed text (OLD → NEW):**

OLD (lines 193-196, VERIFIED):

```markdown
- Core must support a bounded, deterministic contract Lens profile for point
  resolution over Principal-qualified claims. A separately benchmarked
  bounded-depth path profile may build on it. The resolver returns explicit
  `FOUND`, proved `ABSENT`, conflict, unsupported, or `UNKNOWN` outcomes.
```

NEW:

```markdown
- Core must support a bounded, deterministic contract Lens profile for point
  resolution over Principal-qualified claims. A separately benchmarked
  bounded-depth path profile may build on it. The resolver returns exactly
  one of five point outcomes: `FOUND`, proved `ABSENT`, `CONFLICT`,
  `UNSUPPORTED`, or `UNKNOWN`. `UNSUPPORTED` means the Realm revision or Plan
  profile does not support the requested capability — deterministic and
  stable at that revision. `UNKNOWN` means the capability is supported but
  the answer cannot be given now, and always carries a machine-readable cause
  code (at minimum `UNAVAILABLE_SOURCE_BASIS`, `PARTIAL_REPLICA`,
  `PLAN_LIMIT_EXCEEDED`, `MISSING_REQUIRED_BASIS`). The point outcome is one
  axis of a two-axis result: presence (this enumeration) is always paired
  with the authorization/freshness basis under which it holds
  (portable signed evidence vs Realm-admitted vs snapshot/current at a named
  basis). Implementations never compress the pair to a Boolean valid.
```

- **Location (consequential 1):** section `### Honest reads and
  reconstruction`, first bullet (lines 206-209). INSERT at the end of that
  bullet (after "`UNKNOWN` is never absence."):

```markdown
  Enumeration status (`COMPLETE`/`PARTIAL`/`UNSUPPORTED`/`UNKNOWN`) and
  point-resolution outcome (`FOUND`/`ABSENT`/`CONFLICT`/`UNSUPPORTED`/
  `UNKNOWN`) are two fixed vocabularies for two result shapes; implementations
  do not mix them or invent members.
```

- **Location (consequential 2):** core-architecture-candidate.md, section
  `### Contract Resolution Plan (Lens)`, lines 319-323. OLD → NEW:

OLD (VERIFIED):

```markdown
For an authoritative local Binding map, missing at the pinned basis is provable
absence. `UNKNOWN` is reserved for unsupported profiles, partial replicas or
backfills, unavailable imported evidence, exceeded Plan limits, or a missing
required basis—not as a substitute for defining a complete local point index.
```

NEW:

```markdown
For an authoritative local Binding map, missing at the pinned basis is provable
absence. `UNSUPPORTED` reports a profile or capability the Realm revision does
not support — deterministic and stable at that revision. `UNKNOWN` is reserved
for answers the Realm supports but cannot give now: partial replicas or
backfills (`PARTIAL_REPLICA`), unavailable imported evidence
(`UNAVAILABLE_SOURCE_BASIS`), exceeded Plan limits (`PLAN_LIMIT_EXCEEDED`), or
a missing required basis (`MISSING_REQUIRED_BASIS`) — not as a substitute for
defining a complete local point index.
```

- **Location (consequential 3):** kickoff lines 60-61. OLD → NEW:

OLD (VERIFIED): `- contract-visible public Lenses/Resolution Plans and honest`
/ `` `FOUND/ABSENT/CONFLICT/UNKNOWN` semantics; ``

NEW: `- contract-visible public Lenses/Resolution Plans and honest` /
`` `FOUND/ABSENT/CONFLICT/UNSUPPORTED/UNKNOWN` semantics; ``

- **Rationale + citation:** The spine currently carries three inconsistent
  spellings: constitution five outcomes in mixed case (lines 195-196,
  VERIFIED), kickoff four outcomes (lines 60-61, VERIFIED), candidate
  treating unsupported as an `UNKNOWN` cause (lines 320-323, VERIFIED) —
  flagged by audit-lanes.json SPINE finding 8 (NOTE, VERIFIED (lane)). The
  proposed split rule (UNSUPPORTED = deterministic capability gap; UNKNOWN =
  supported-but-unanswerable-now, with cause codes) is the one reading that
  makes all three texts true at once. The two-axis sentence carries the
  survivor-register §10 grade axis ("never compress these to a Boolean
  valid"; presence vs authorization/freshness are orthogonal) per
  audit-lanes.json SURVIVORS finding 5 (VERIFIED (lane); I did not read
  assumptions-and-requirements.md §10 directly). Cause-code names are new.
- **Label:** [PROPOSAL] (vocabulary reconciliation + cause-code registry;
  rationale above) carrying one [DERIVED INVARIANT restoration] — the
  two-axis never-compress rule, cited to assumptions-and-requirements.md §10
  and R-X2/R-K8 via the SURVIVORS audit lane.
- **Contradiction called out:** explicitly — kickoff:60-61 (four outcomes)
  vs constitution:195-196 (five outcomes) vs candidate:320-323 (unsupported
  inside UNKNOWN). This item resolves all three in one direction.
- **Authority routing:** PM adopts (constitution and candidate are drafts;
  the kickoff line is PM-owned). No James decision needed — no ruling
  addressed outcome vocabulary.

---

## B. Designs/efsv2/README.md

### B1. Build order: the Fable pass is a staged program

- **Target file:** Designs/efsv2/README.md
- **Location:** section `## Build order` (lines 92-106).
- **Verbatim proposed text (OLD → NEW):**

OLD (lines 94-106, VERIFIED):

```markdown
1. Review the constitution and current candidate against the full survivor
   ledger and application fixtures.
2. Implement two disposable Core prototypes: self-contained Records versus
   immutable shared Context/Envelope normalization.
3. Benchmark complete write, storage, index, reconstruction, and Lens costs—not
   isolated happy paths.
4. Run the focused Fable 5 pass plus independent database, EVM/security,
   standards, privacy, and long-horizon reviews.
5. Integrate accepted findings, close the owner-sized choices, and only then
   prepare the freeze bundle and contracts/SDK plan.
6. In parallel, build the narrow direct Web Client/File Browser + one-game
   Arcade slice behind an adapter so product work tests the model without
   freezing it by accident.
```

NEW:

```markdown
1. Review the constitution and current candidate against the full survivor
   ledger and application fixtures.
2. Run the commissioned Fable 5 engineering program in stages. Stage A
   (design, current) delivers the exact B0 baseline, the smallest semantic
   model with explicit alternatives, requirement-to-test traceability, the
   controlled bakeoff specification, frozen fixture and measurement-harness
   interfaces, golden-vector categories and falsifiers, and proposed spine
   edits — then stops for review. Stage B implements the disposable bakeoff
   prototypes against those frozen interfaces. Stage C benchmarks complete
   write, storage, index, reconstruction, and Lens costs — not isolated happy
   paths.
3. Run independent database, EVM/security, standards, privacy,
   crypto/identity, and long-horizon reviews against the program's output.
4. Integrate accepted findings, close the owner-sized choices, and only then
   prepare the freeze bundle and contracts/SDK plan.
5. In parallel, build the narrow direct Web Client/File Browser + one-game
   Arcade slice behind an adapter so product work tests the model without
   freezing it by accident.
```

- **Rationale + citation:** The SPINE audit's one BLOCKING finding is that
  the kickoff demands both prototype specifications and a complete cost table
  while README/constitution sequence the Fable pass after prototyping and
  benchmarking, producing two incompatible readings of the deliverable
  (audit-lanes.json SPINE finding 1, VERIFIED (lane); the underlying
  README:94-101 and constitution:324-330 texts VERIFIED by me). The PM
  resolved it: "Proceed with Stage A only… Stop after Stage A for review"
  with the eight Stage-A deliverables enumerated (pm-stage-a-directive.md:3-13
  and 25, VERIFIED). The new step 2 encodes that resolution; old steps 2-3
  become Stages B/C of the same program instead of prerequisites of it. The
  reviewer list adds crypto/identity, which the kickoff already requires
  (kickoff:171-172, VERIFIED) — a small spine-internal inconsistency noted in
  audit-lanes.json SPINE finding 12(c) (VERIFIED (lane)).
- **Consequential edit (same rationale):** constitution `## Freeze
  discipline` steps 2-4 (lines 324-330) carry the same inverted sequencing.
  Propose rewording step 4 from "Run the focused Fable 5 engineering pass and
  independent long-horizon, database, EVM-security, and standards review" to
  "Complete the staged Fable 5 engineering program (design, then prototypes,
  then benchmarks) and independent long-horizon, database, EVM-security,
  privacy, crypto/identity, and standards review", and marking steps 2-3 as
  Stages B/C of that program. Exact wording left to the PM since this section
  is otherwise unchanged.
- **Label:** [PM DIRECTIVE adoption] (Stage-A ruling, 2026-08-12).
- **Contradiction called out:** explicitly — kickoff outputs 3-4 vs README
  build-order 2-4 vs constitution freeze-discipline 2-4. This item resolves it
  in the direction the PM ruled.
- **Authority routing:** PM applies (process/sequencing documentation;
  vault-process scope). No James decision needed — the PM's Stage-A ruling is
  the cited authority and James commissioned the program.

### B2. Add the Stage A doc set + corpus to the README doc table

- **Target file:** Designs/efsv2/README.md
- **Location:** INSERT a new subsection immediately after the `## Evidence
  map` table (which ends at ~line 90) and before `## Build order`.
- **Verbatim proposed text (INSERT):**

```markdown
## Fable program output — Stage A doc set

Stage A output is design-current and review-gated: drafts for red-team
review, adopting nothing until integrated. Chapters pin the exact B0 "SPINE"
baseline; the corpus holds the cross-cutting deliverables.

| Stage A deliverable | Doc |
|---|---|
| Exact B0 baseline — per-subsystem chapters | `chapters/b0-overview.md` + the eight `chapters/b0-*` subsystem chapters |
| Smallest coherent semantic model + explicit alternatives | `chapters/b0-overview.md` §1 + `chapters/bakeoff-spec.md` |
| Requirement-to-test traceability with authority labels | `chapters/traceability.md` |
| Controlled bakeoff specification (axes, cells, declared confounds) | `chapters/bakeoff-spec.md` |
| Frozen fixture + measurement-harness interfaces | `chapters/harness-and-fixtures.md` |
| Golden-vector categories and falsifiers | `chapters/vectors-and-falsifiers.md` |
| Proposed spine edits (proposals only; shared files unedited) | `corpus/proposed-spine-edits.md` |
| Citations/durable evidence for journal-only claims | `corpus/standards-audit.md`, `carry-in-register.md`, `intake-findings.md`, `redteam-findings.md` |
```

- **Rationale + citation:** The eight rows are the PM's Stage-A deliverables
  1-8 verbatim-in-substance (pm-stage-a-directive.md:5-13, VERIFIED). The
  2026-07-16 META ruling exists precisely because README staleness caused
  owner-visible artifacts to be missed ("README.md is stale — still lists
  [[identity]] as primary and does NOT index [[kel]]…", owner-rulings.md:100,
  VERIFIED); indexing the Stage A set on landing prevents a recurrence.
  The final Stage A artifact names are the current overview inventory
  (`b0-overview.md` §3, VERIFIED): the B0 overview plus eight subsystem
  chapters, bakeoff, traceability, harness, vectors/falsifiers, proposed-spine
  edits, and the four durable-evidence ledgers. This proposed table names those
  existing artifacts; it does not authorize a README edit.
- **Label:** [PM DIRECTIVE adoption] (deliverable list) + [PROPOSAL] (table
  placement and row wording).
- **Authority routing:** PM applies at Stage A landing.

---

## C. Designs/efsv2/fable-efs2-core-engineering-kickoff.md

The kickoff is `#kind/prompt` and PM-owned (task directive, VERIFIED); all C
items route through the PM. These are the amendments the PM adopted in the
Stage-A reply plus their concrete verbatim realizations; where an item goes
beyond the adopted list it is separately labeled.

### C1. Lens scaling fixture, beneficiary negative test, callback-abuse attack

- **Target file:** kickoff, two locations.
- **Location 1:** `### Generic workload fixtures`, line 132.
- **Verbatim proposed text (OLD → NEW):**

OLD (line 132, VERIFIED):

```markdown
- contract configuration: two Principals and a risk-bearer-pinned Lens;
```

NEW:

```markdown
- contract configuration: risk-bearer-pinned Resolution Plans of 1, 8, 32,
  and 64 Principals, measuring first/last/absent/conflict/unknown outcomes
  cold and warm; a beneficiary-supplied plan must fail to authorize the
  beneficiary; the bounded-depth path profile is benchmarked separately or
  explicitly deferred with a citation;
```

- **Location 2:** `### Required technical gates`, attack list (lines
  112-116). INSERT into the list, after "cross-Realm replay/domain
  confusion,":

```markdown
  Lens-side authority-callback abuse (a Plan crafted to induce per-Principal
  authority callbacks during a read),
```

- **Rationale + citation:** The constitution's Contract Lens acceptance trace
  requires "1/8/32/64-Principal plans in bounded gas; a beneficiary-supplied
  plan cannot authorize the beneficiary" (system-constitution.md:309,
  VERIFIED); inbox gate V2-E2 requires the same benchmark with
  first/last/absent/conflict/unknown, cold and warm
  (owner-decision-inbox.md:26-31, VERIFIED); candidate falsifier 8 rejects
  "contract Lens reads call arbitrary authority callbacks per Principal"
  (core-architecture-candidate.md:429, VERIFIED). The kickoff's two-Principal
  fixture exercises none of these (audit-lanes.json SPINE finding 2, SERIOUS,
  VERIFIED (lane)). PM adopted this amendment in the Stage-A reply (task
  directive, VERIFIED).
- **Label:** [DERIVED INVARIANT restoration] — constitution:309 +
  V2-E2 + candidate falsifier 8; PM-adopted.
- **Authority routing:** PM applies.

### C2. V2-E5 scope-in: Realm descriptor, finality observation, bootstrap

- **Target file:** kickoff.
- **Location:** `### What to solve` list; INSERT a new bullet after the
  reconstruction bullet ("state-readable reconstruction, upgrades that never
  silently reinterpret old data, and standards-based self-describing external
  references;", lines 62-63).
- **Verbatim proposed text (INSERT):**

```markdown
- a self-contained Realm descriptor for a fresh qualifying L3 — registry-free
  client bootstrap, deployment/profile-confusion attacks, the
  admission/finality-observation split, upgrade history, and independent
  state reconstruction (inbox gate V2-E5);
```

- **Rationale + citation:** V2-E5 requires exactly this
  (owner-decision-inbox.md:47-52, VERIFIED); the constitution and candidate
  both name the descriptor as an open target
  (system-constitution.md:353-354; core-architecture-candidate.md:61 and
  443, VERIFIED); yet "descriptor" and "finality" never appear in the kickoff
  (audit-lanes.json SPINE finding 3, SERIOUS, VERIFIED (lane)). The PM
  execution default makes it binding: "V2-E5's minimal Realm descriptor,
  admission basis, finality observation, upgrade history, and independent
  reconstruction are in scope" (pm-stage-a-directive.md:17, VERIFIED).
- **Label:** [PM DIRECTIVE adoption].
- **Authority routing:** PM applies.

### C3. Eighth bakeoff axis, disposed as analysis-only

- **Target file:** kickoff.
- **Location:** `### Controlled bakeoffs — do not confound the axes`, the
  numbered axis list (lines 73-84). INSERT after axis 7:

```markdown
8. publisher-qualified namespace versus semantic spec commitment for Type
   schema identity — an analysis-only axis: no gas or fixture measurement
   discriminates it, so it is decided by written analysis plus golden
   vectors (two publishers hashing the same spec text — same or different
   ID by declared intent), not by a prototype cell.
```

- **Rationale + citation:** The candidate's alternatives table has eight rows
  and the kickoff commissions seven axes; the dropped row is "Type schema
  identity | publisher-qualified namespace | semantic spec commitment with
  optional qualification" (core-architecture-candidate.md:413, VERIFIED;
  audit-lanes.json SPINE finding 4, SERIOUS, VERIFIED (lane)). The BAKEOFF
  lane's disposition — analysis-only, since the evidence column is a
  governance/identity argument, not a measurable — is adopted here
  (audit-lanes.json BAKEOFF finding 3, VERIFIED (lane)). PM adopted the
  disposition in the Stage-A reply (task directive, VERIFIED).
- **Label:** [DERIVED INVARIANT restoration] (the axis, from the candidate's
  own table) + [PROPOSAL] (its analysis-only disposition, per the BAKEOFF
  lane rationale); PM-adopted.
- **Authority routing:** PM applies.

### C4. EAS-interop clause: compatibility ban does not cancel the adapter seam

- **Target file:** kickoff.
- **Location:** the greenfield paragraph, after "Do not
  restore compatibility, migration, coexistence, or legacy-read
  requirements." (lines 19-20). INSERT:

```markdown
That ban covers v1-data compatibility. It does not cancel loss-aware EAS
import/export interoperability: the full EAS loss-map implementation is
deferred to the V2-E8 portable-schema/validator pass, but this pass must
specify the adapter seam — where an optional EAS projection attaches, what it
may and may not require of Core, and which losses the map must declare.
```

- **Rationale + citation:** V2-E8 names "loss-aware EAS interoperability"
  (owner-decision-inbox.md:70-75, VERIFIED); README keeps the adapter live
  ("An EAS import/export adapter remains possible if it provides real
  interoperability", README.md:71-72, VERIFIED); the SPINE audit flagged the
  kickoff's blanket ban as readable as license to skip it (audit-lanes.json
  SPINE finding 5, SERIOUS, VERIFIED (lane)). The PM execution default is
  binding: "Defer the full EAS loss-map implementation to V2-E8; preserve
  and specify the adapter seam here" (pm-stage-a-directive.md:18, VERIFIED).
- **Label:** [PM DIRECTIVE adoption].
- **Authority routing:** PM applies.

### C5. Explicit inbox gate-coverage map

- **Target file:** kickoff.
- **Location:** `### Outputs`; INSERT a paragraph immediately after the
  numbered outputs list (after line 167).
- **Verbatim proposed text (INSERT):**

```markdown
State the inbox gate coverage explicitly in the traceability output: this
pass generates evidence for V2-E1, V2-E2, V2-E3, V2-E4, and V2-E5, and
partially V2-E8 (the EAS adapter seam only; the loss-map itself is deferred
to the V2-E8 pass), all feeding V2-F1. V2-E6 (Web Client/OS vertical slice)
and V2-E7 (Commons venue matrix) are out of this pass's scope and remain
open; completion of this pass must not be mistaken for full inbox coverage.
```

- **Rationale + citation:** The kickoff never states which gates it covers,
  and E6/E7 are exercised by nothing in it (audit-lanes.json SPINE finding 6,
  NOTE, VERIFIED (lane); V2-E6/E7 texts at owner-decision-inbox.md:54-68,
  VERIFIED). PM adopted the map with exactly this in/out split in the
  Stage-A reply (task directive, VERIFIED), consistent with the directive's
  V2-E5 scope-in and V2-E8 deferral (pm-stage-a-directive.md:17-18,
  VERIFIED).
- **Label:** [PM DIRECTIVE adoption].
- **Authority routing:** PM applies.

### C6. Succession/renewal seams, persona probe, timed-equivocation attack

- **Target file:** kickoff, three locations.
- **Location 1:** attack list (lines 112-116). INSERT after "authority
  backdating,":

```markdown
  signature-suite succession hazards (an old suite becomes forgeable; two
  kernel/Core generations both admit), timed equivocation against contract
  gates (the duplicity-bit TOCTOU pattern),
```

- **Location 2:** `### Outputs`, output 7 (line 165). OLD → NEW:

OLD (VERIFIED): `7. explicit cuts, deferred-but-reserved seams, and abort conditions; and`

NEW:

```markdown
7. explicit cuts, deferred-but-reserved seams — naming at least
   cryptographic/algorithm succession and single-active-kernel succession
   (survivor rows R-K10, R-K12, R-M3, O-3, D-7), recovery-role separation
   (R-K6), recoverable-vs-shreddable privacy tiers (R-P3/R-P8),
   foreign-contract adapter and local-commitment disclosure (R-X5/R-X7),
   pending/outbox truth boundaries (R-O8), and censoring-relayer inclusion
   (E-2) — and abort conditions; and
```

- **Location 3:** bakeoff axis 2 (lines 75-76). INSERT at the end of the
  axis-2 line: `, including whether one root can later manage multiple
  unlinkable account Principals without relinking them`.
- **Rationale + citation:** The succession cluster has no kickoff bullet,
  gate, fixture, or output — "no occurrence of 'succession', 'renewal',
  'post-quantum', or signature-suite transition" — and is "the largest
  silent-loss risk" for a Core intended to freeze (audit-lanes.json
  SURVIVORS finding 2, SERIOUS, VERIFIED (lane); row texts R-K10/R-K12/O-3/D-7
  cited there from assumptions-and-requirements.md, which I did not read
  directly). The reserved-seam ID list is SURVIVORS finding 8's enumeration
  (VERIFIED (lane)). The timed-equivocation attack implements the PM default
  preserving the equivocation/TOCTOU lesson (pm-stage-a-directive.md:21,
  VERIFIED) and RULINGS finding 1's recommendation (VERIFIED (lane)). The
  persona probe carries A3's ruling into the axis-2 bakeoff per RULINGS
  finding 5 (VERIFIED (lane)). PM adopted the succession/renewal adds in the
  Stage-A reply (task directive, VERIFIED).
- **Label:** [PM DIRECTIVE adoption] (succession seams, TOCTOU attack) +
  [OWNER RULING restoration] (persona probe, owner-rulings.md 2026-07-15:73).
- **Authority routing:** PM applies.

### C7. Golden-vector adds: R-D9 time/order, R-D8 rail substitution, R-L1/L3 plan vectors

- **Target file:** kickoff, two locations.
- **Location 1:** golden-vector gate (lines 94-96). OLD → NEW:

OLD (VERIFIED):

```markdown
- Produce cross-language golden bytes, IDs, signatures, and page keys in
  Solidity, TypeScript, and Rust, including invalid, unknown-version, replay,
  cross-Realm, subset-carriage, duplicate, partial-failure, and upgrade vectors.
```

NEW:

```markdown
- Produce cross-language golden bytes, IDs, signatures, page keys, and
  canonical Resolution-Plan encodings in Solidity, TypeScript, and Rust,
  including invalid, unknown-version, replay, cross-Realm, subset-carriage,
  duplicate, partial-failure, and upgrade vectors; time/order vectors
  (misleading claimed times, same-author same-order multiplicity,
  admission-time versus claimed-time divergence — author order is not nonce
  or chronology, claimedAt is testimony, admittedAt is Realm-relative); and a
  minimal adversarial Plan corpus (cycle, duplicate source, limit overflow).
```

- **Location 2:** attack list (lines 112-116). INSERT after "EIP-7702
  classification,":

```markdown
  relayer/paymaster/submission-rail substitution (the same portable envelope
  submitted by a different rail or sponsor must yield identical authorship
  and identity; no rail can mint or alter authorship),
```

- **Rationale + citation:** R-D9's freeze-sensitive time/order semantics have
  no kickoff vector and the §12.7 equivocation-rule correction is uncarried
  (audit-lanes.json SURVIVORS finding 4, SERIOUS, VERIFIED (lane)); R-D8's
  acceptance evidence is relayer/paymaster substitution vectors, absent from
  the attack list (SURVIVORS finding 7, NOTE, VERIFIED (lane)); R-L1/R-L3
  demand cross-language lens-plan determinism vectors and an adversarial
  compiler corpus (SURVIVORS finding 6, NOTE, VERIFIED (lane)). All three
  adds were PM-adopted in the Stage-A reply (task directive, VERIFIED). The
  candidate's author/actor/payer separation (core-architecture-candidate.md:
  250-251, VERIFIED) is the requirement the rail-substitution vector tests.
- **Label:** [DERIVED INVARIANT restoration] — survivor rows R-D9, R-D8,
  R-L1/R-L3 via the SURVIVORS audit lane; PM-adopted.
- **Authority routing:** PM applies.

### C8. Standards additions — facts distinguished from EFS policy

- **Target file:** kickoff.
- **Location:** `### Standards and prior art` (lines 146-153). OLD → NEW of
  the source list sentence:

OLD (lines 148-153, VERIFIED):

```markdown
Prefer established standards and justify every EFS invention. Re-check primary
sources as relevant: EAS; EIP-1271/4337/6492/7702/7913 and draft EIP-8130;
multihash/CID and deterministic CBOR; RFC 6920; RDF/RDFC and graph database
index models; Git SHA-1/SHA-256 and ISO SWHID; capability and append-only data
systems. Separate stable standards from drafts and avoid adopting a standard
outside the problem it actually solves.
```

NEW:

```markdown
Prefer established standards and justify every EFS invention. Re-check primary
sources as relevant: EAS; EIP-1271/4337/6492/7702/7913 and draft EIP-8130;
EIP-712; EIP-7825; EIP-170; EIP-4444/7927; CAIP-2/CAIP-10 and ERC-7930;
W3C DID-core; ERC-5564; multihash/CID and deterministic CBOR; RFC 6920;
RDF/RDFC and graph database index models; Git SHA-1/SHA-256 and ISO SWHID;
capability and append-only data systems. Separate standards FACTS from EFS
POLICY: a standard's status and mechanics are facts to verify against primary
sources; whether EFS adopts, projects, or rejects it is a policy
recommendation carrying its own label. Two facts are protocol physics, not
candidates: EIP-7825 caps every L1 transaction at 16,777,216 gas (2^24; live
since Fusaka, 2025-12-03) — every one-call dependent write, mandatory-index
fan-out, and atomic batch must show its arithmetic under that cap, with any
different L2/L3 cap stated separately; and EIP-170 caps runtime bytecode at
24,576 bytes (EIP-7907 did not ship in Fusaka), which bounds the one-physical-
Core-versus-modules axis at compile time. Separate stable standards from
drafts and avoid adopting a standard outside the problem it actually solves.
For the PM-named status recheck: ERC-6492 is Final; ERC-7930 is Review;
EIP-4444 and EIP-7927 are Stagnant documents even though pre-merge history
deletion is partially deployed; CBOR CDE draft-13 is expired/archived and not
an RFC; and RDFC-1.0 is a 2024 W3C Recommendation.
```

- **Rationale + citation:** The PM directive requires standards-status
  correction and a FACT/POLICY separation, especially for ERC-6492, ERC-7930,
  EIP-4444/7927, CBOR CDE, and RDFC (`pm-stage-a-directive.md:23`, VERIFIED).
  The repaired audit provides their direct primary-source citations and exact
  statuses: `standards-audit.md` §2.7 (ERC-6492 Final), §3.6 (ERC-7930 Review),
  §2.14 (EIP-4444/7927 Stagnant documents plus separate partial-deployment
  fact), §3.3 (CDE-13 expired/archived I-D, not RFC), and §2.13 (RDFC-1.0 W3C
  Recommendation, 2024-05-21). EIP-7825, EIP-170, EIP-712, CAIP, DID, and
  ERC-5564 remain useful evidence-lane candidates, but neither their list
  membership nor any EFS action is adopted by the directive or this proposal.
- **Label:** [PM DIRECTIVE adoption] applies only to the Stage-A process rule:
  FACT/POLICY separation and rechecking the five PM-named entries. The expanded
  standards-list membership and every EFS action on those facts are [PROPOSAL].
  EIP-7825 and EIP-170 are standards FACTS with venue/fork qualifications and
  direct primary evidence; treating a harness policy as consequential is
  [PROPOSAL], not a standards fact.
- **Authority routing:** PM applies.

### C9. Four-tier support matrix: fold into output 7 or retire — flag for PM

- **Target file:** kickoff (if folded), plus a disposition decision.
- **Location:** `### Outputs`, output 7 (line 165, as amended by C6). If
  folded, INSERT at the end of the amended output 7, before "; and":

```markdown
   , presented as the four-tier support matrix (required / extension-ready /
   experimental / explicitly unsupported) that the 2026-07-22 contraction
   gate requires
```

- **Rationale + citation:** The 2026-07-22 direction requires, at the
  contraction gate, "the short constitution and explicit support matrix …
  distinguish[ing] required, extension-ready, experimental, and explicitly
  unsupported behavior" (owner-rulings.md:121, VERIFIED). The constitution
  exists; the matrix was never produced or retired (audit-lanes.json RULINGS
  finding 6, NOTE, VERIFIED (lane)). Options: (a) **fold** — Stage A output 7
  naturally carries it (cuts/reserved seams map onto the four tiers) and no
  new authority is needed since this produces what James asked for;
  (b) **retire** — requires James, because it cancels a deliverable he
  directed. Recommendation: (a).
- **Label:** [PROPOSAL] (fold recommendation) restoring an
  [OWNER RULING]-directed deliverable (owner-rulings.md 2026-07-22:121).
- **Authority routing:** **flag for PM** — PM chooses (a) and applies, or
  routes (b) to James. Explicitly not self-adopting.

---

## D. Designs/efsv2/owner-rulings.md — suggestion only

### D1. Inline the Aug-8 deterministic-IDs sentence for ledger self-sufficiency

- **Target file:** Designs/efsv2/owner-rulings.md (James's append-only
  ledger; PM/owner-owned — this is a drafting suggestion, not an edit
  request this pass can perform).
- **Location:** the 2026-08-12 entry, first bullet, after "This carries
  forward the August 8 ruling previously recorded in [[Decisions]]."
  (lines 176-177).
- **Verbatim suggested text (INSERT, as a recorder's citation note):**

```markdown
  (Verbatim from that ruling: "Universal deterministic EFS identities remain
  required, but EAS, the seven-word EFS 1.5 carrier prefix, sibling-schema
  architecture, existing v1/v2 record kinds, and every other inherited
  mechanism must re-earn inclusion against the accumulated requirements and
  product traces." — ruled by @james, 2026-08-08, [[Decisions]].)
```

- **Rationale + citation:** The kickoff's owner-ratified frame lists
  "universal deterministic IDs" (kickoff:38, VERIFIED), but owner-rulings.md's
  own 2026-08-12 text never mentions deterministic IDs — the ratification
  lives only in Decisions.md's 2026-08-08 entry (Decisions.md, 2026-08
  section, first entry: "Universal deterministic EFS identities remain
  required…" — ruled by @james, 2026-08-08; VERIFIED, I read the entry). A
  future audit relying on owner-rulings alone would flag the kickoff as
  attribution inflation (audit-lanes.json RULINGS finding 7, NOTE, VERIFIED
  (lane)). Inlining the sentence makes the ledger self-sufficient. Because
  the ledger is append-only and carries only James-attributed content, the
  correct form (inline citation note vs a new dated recorder entry) is the
  PM's/James's call; the quoted material is James's own ruling verbatim, so
  no new decision content is introduced.
- **Label:** [PROPOSAL] (editorial self-sufficiency; quoted content is an
  existing [OWNER RULING], Decisions.md 2026-08-08).
- **Authority routing:** James (PM may draft; the ledger records only
  James-attributed rulings, and altering its entries is his call under
  Onboarding/authority.md rule 1 and the recording convention).

---

## Contradiction ledger (kickoff output 8 obligation)

| # | Contradiction | Resolved by | Direction |
|---|---|---|---|
| 1 | Kickoff outputs 3-4 (specs AND complete cost table) vs README/constitution sequencing (Fable pass after prototyping/benchmarks) — SPINE finding 1, BLOCKING | B1 | Staged program per PM Stage-A ruling: Stage A designs, B/C measure |
| 2 | Kickoff four resolver outcomes vs constitution five vs candidate unsupported-inside-UNKNOWN | A4 | One five-outcome enumeration; UNSUPPORTED distinct; UNKNOWN carries cause codes |
| 3 | Kickoff seven bakeoff axes vs candidate eight alternative rows | C3 | Eighth axis added, disposed analysis-only |
| 4 | Kickoff compatibility ban vs README/constitution live EAS adapter option | C4 | Ban scoped to v1 data; adapter seam specified now, loss-map deferred to V2-E8 |
| 5 | Two-Principal Lens fixture vs constitution 1/8/32/64 acceptance trace + V2-E2 | C1 | Fixture scaled; negative test + callback attack added |
| 6 | Spine silence vs owner item F (equivocation) and the historical chains-don't-die ruling | A1, A2 | A1 restores attributed ruling content; A2 is a set-wide scope proposal. Mechanics stay unfrozen and A2 is not adopted by listing it. |
| 7 | Reviewer lists diverge (constitution omits privacy; README omits crypto/identity) | B1 (+ its consequential constitution edit) | Union list: database, EVM/security, standards, privacy, crypto/identity, long-horizon |

## Interfaces exposed

Other chapters and the synthesizer may rely on the following from this
document; item IDs are stable for citation as `proposed-spine-edits <ID>`:

- **16-item registry:** A1 (item-F restoration), A2 (qualifying-Realm +
  `UNAVAILABLE_SOURCE_BASIS` scope proposal), A3 (personas in extension list),
  A4 (outcome vocabulary), B1 (staged build order), B2 (Stage A doc table),
  C1-C9 (kickoff amendments incl. C9 support-matrix flag), D1
  (owner-rulings suggestion). Nothing is adopted until the named authority
  applies it; chapters citing these items must cite them as proposals.
- **Resolver point-outcome enumeration (A4):** `FOUND | ABSENT | CONFLICT |
  UNSUPPORTED | UNKNOWN`, exactly one per point resolution; `UNSUPPORTED` =
  deterministic capability gap at a Realm revision; `UNKNOWN` = supported but
  unanswerable now, always with a cause code from the minimal registry
  `{UNAVAILABLE_SOURCE_BASIS, PARTIAL_REPLICA, PLAN_LIMIT_EXCEEDED,
  MISSING_REQUIRED_BASIS}` (registry extensible by the Lens/resolver chapter;
  values are ASCII constant names, wire encoding owned by that chapter).
- **Two-axis result rule (A4):** presence outcome is always paired with an
  authorization/freshness basis; no API, storage shape, or UI may compress
  the pair to one Boolean.
- **Enumeration-status vocabulary (A4):** `COMPLETE | PARTIAL | UNSUPPORTED |
  UNKNOWN` for paged reads — distinct from the point-outcome enumeration;
  chapters must not mix the two.
- **Qualifying-Realm proposal (A2):** A2 is the sole proposed spine location
  for the per-Realm scope. It is not adopted by this list. Until a later owner
  adoption, chapters use the overview's set-wide disposition: qualifying-Realm
  assumptions and `UNKNOWN(UNAVAILABLE_SOURCE_BASIS)` behavior remain honest
  under either scope answer; required-source unavailability is never `ABSENT`.
- **Equivocation boundary (A1):** no chapter may propose an on-chain
  collision/duplicity bit without overcoming the recorded TOCTOU refutation;
  contract-gate certainty against untrusted authors is closed author sets or
  a challenge window; conflict-evidence storage mechanics remain open to the
  Binding/resolver chapters.
- **Gate-coverage claim (C5):** Stage A traceability should claim evidence
  for V2-E1..E5 + E8-partial (adapter seam) only; never E6/E7.

## Open items

1. **A2 status** — A2 remains the sole owner-routed scope proposal; Stage A
   does not ask for adoption now. If later promoted, James is the authority.
   It is not a present Stage A blocker.
2. **C9 disposition** — fold the four-tier support matrix into output 7
   (recommended, no new authority needed) or route retirement to James.
   Closed by: PM; James only if retirement is chosen.
3. **D1 form** — inline citation note vs a new dated recorder entry in the
   append-only ledger. Closed by: PM drafts, James accepts (his ledger).
4. **Constitution freeze-discipline rewording** — B1's consequential edit to
   constitution steps 2-4 is described but not given final verbatim text
   (the section is otherwise untouched and the PM owns the integration
   wording). Closed by: PM when applying B1.
5. **Cause-code registry ownership** — A4 names four minimal `UNKNOWN` cause
   codes; the authoritative registry, wire encoding, and extension rule
   belong to the Lens/resolver chapter (b0-lens). Closed by: b0-lens chapter
   + synthesizer reconciliation.
6. **Survivor-row texts cited via the audit lane** — R-K10/R-K12/R-D8/R-D9/
   R-L1/R-L3/§10/§12.7 and the reserved-seam IDs in C6/C7 are quoted from
   audit-lanes.json (which read assumptions-and-requirements.md in full),
   not from the register directly. Closed by: red team spot-checking the
   register lines named in the SURVIVORS lane before the kickoff edits land.
