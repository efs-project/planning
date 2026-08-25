# EFS 2.0 — owner decision inbox

**Status:** reference — compact live queue; mechanisms remain evidence-gated
**Audience:** James first; designers second
**Last reconciled:** 2026-08-25
**Inputs:** [[system-constitution]], [[core-architecture-candidate]], [[owner-rulings]], [[assumptions-and-requirements]], and the preserved July decision/review corpus in git history

#status/reference #kind/decision #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2

> **Build-start sequencing hold (2026-08-25): do not ask V2-C1 until the SDK and Explorer consume the exact Core source lock without a P0/P1 truth mismatch.**

`GO-CODE` is the one remaining owner build-start choice. The current disposition
is `CONTINUE-DISPOSABLE`. The 2026-08-25 instruction to work top-to-bottom
selects the direct guest Explorer plus minimum Files profile as the candidate
vertical; it does not authorize permanent code, a protocol freeze, or
deployment.

## 2026-08-25 build-start evidence update

The disposable `EXP-C0/v0` pass has reduced the early mechanism questions to
provisional engineering selections rather than abstract owner forks. Two of
the measured selections are:

- **V2-E1 Principal surface:** the full-width uniform `PrincipalId` arm has no
  pre-write setup transaction, uses one ABI word in steady-state author APIs
  versus two for `Account | Principal`, binds authority kind/origin in identity,
  and keeps one historical keyspace across a later managed association. The
  representative comparator measured keyed reads/writes no worse than the
  tagged arm. Use uniform `PrincipalId` in the candidate; reopen only if full
  first-admission descriptor persistence plus EOA/ERC-1271 verification fails
  the aggregate budget or developer-ergonomics test. This is evidence, not an
  owner freeze ruling.
- **V2-E2 Contract Lens floor:** an immutable point ResolutionPlan at 1/8/32/64
  Principals now runs in independent JavaScript and mapping-backed Solidity.
  Proved absence alone permits fallback; unknown/conflict/unsupported/mixed
  basis stops. The last-found path measured 30,504 / 92,369 / 314,759 / 616,577
  gas on the first measured resolve and 7,699 / 30,113 / 108,979 / 220,280 on
  the immediately repeated resolve under the disposable solc 0.8.30 Osaka
  profile. Use 64 as a candidate experiment cap; production
  cap and topology remain freeze evidence.

The current consolidated packet is [[mvp-build-start-packet]]. The owner need not
decide final bytes, caps, topology, or the first product slice to authorize
nondeployable candidate engineering. The owner should not answer the build-start choice
yet: first the SDK and Explorer must preserve the exact Core handoff. If that
cross-lane gate remains green, the owner checkpoint decides only `GO-CODE` and
leaves measured implementation questions to the engineers.

## Decide after evidence — build-start handoff, do not answer yet

### V2-C1 — Authorize replaceable nondeployable candidate engineering

Authorize `GO-CODE` for one measured, explicitly replaceable EFS v2 candidate:
monolithic Core control, raw-preserving SDK, and guest Explorer adapter. This
does **not** authorize ceremony-final bytes, a protocol freeze, production
deployment, permanent data, a Commons venue, or a release claim. The
current disposition is `CONTINUE-DISPOSABLE`; the recommendation becomes
**yes** only if all three lanes pin the same exact fixture/checksums, the SDK and
Explorer preserve raw values/basis/coverage/acquisition evidence, the direct
guest route requires no wallet or ambient service, and the final cross-lane
audit finds no P0/P1 truth mismatch.

## Delegated candidate defaults — reopen only on a named falsifier

### V2-C2 — First vertical product target

Use the direct no-wallet raw Data Explorer plus the minimum Files profile so
Core, SDK, verified bytes, and a human-visible filesystem path are measured
together. This follows the owner's explicit top-to-bottom overnight direction.
Fall back to Core and SDK alone only on a named integration blocker. This does
not commit the eventual Explorer UX, filesystem profile, or contract topology.

### V2-E1 — Principal surface

Use one uniform full-width `PrincipalId` author/Lens/index API, including
zero-setup account Principals. Reopen only if aggregate first-admission
descriptor/verification cost or developer complexity exceeds the candidate
budget. This is a build default, not frozen identity bytes.

### V2-E2 — Contract Lens floor

Use immutable point `ResolutionPlanV0` plus
`FIRST_FOUND_AFTER_PROVED_ABSENCE`, measuring 1/8/32/64 Principals and using 64
as the candidate experiment ceiling. Reopen the cap/topology if integrated Core
gas or result bounds fail. Wide directories and rich private Lenses remain
separate.

### V2-E3 — Record and shared-context bakeoff

Use author-neutral exact Records plus separate portable `PublicationSet`,
per-leaf `Occurrence`, and destination Admission. Reopen only if an application
fixture cannot preserve required immutable context without application-specific
Core state, or integrated cost materially favors a lossless smaller split.

### V2-E4 — Type and index budget

Use the bounded flat nominal Type, selected ascending-field ABI body law,
exact-Type QueryProfiles, automatic equality/reference/backlink obligations,
32-member candidate pages, and exact basis/completeness model. Measure hostile
values and churn in candidate code; return to James only if the aggregate
budget requires dropping a constitutional query promise.

### V2-E5 — Realm bootstrap and authority history

Use a self-authenticating Realm bootstrap plus append-only revisions, explicit
disclosed powers, exact EOA/ERC-1271 profiles and retained historical
transcripts, with observer finality kept separate. No Commons or other chain is
required. Reopen only if the integrated authority/reconstruction control finds
a missing identity-bearing coordinate.

### V2-E8 — Shared Types and validators

Use ordinary application Types, structural canonical validation, finite closed
references, separately versioned behavior/query profiles, and generated SDK
validators. Do not add arbitrary onchain callbacks or application-specific Core
kinds. Reopen only if a real application requires semantics that cannot be
represented or validated losslessly within bounded generic mechanisms.

## Decide after evidence — do not answer yet

### V2-E7 — Commons venue criteria

Do not select a chain yet. First turn the adopted cypherpunk/CROPS boundary into
a measurable venue matrix: capture and censorship resistance, public
source/state, rule-change/governance risk, force inclusion, independent RPC and
node operation, finality, state availability, fees, walk-away reconstruction,
and exit/successor behavior.

## Decide after evidence — freeze choices, do not answer yet

### V2-F1 — Freeze the minimum semantic protocol

Choose exact Type/Record/Occurrence/Context/Realm/Binding/Lens bytes, ID and
signature domains, canonical codec, index declarations, successor/coexistence
rules, and contract/module boundary only after cross-language vectors,
benchmarks, clean-room reconstruction, Fable 5 review, and independent
adversarial review pass.

### V2-F2 — First product implementation scope

Choose the first permanent contracts/SDK/Web Client release after the freeze
candidate proves the direct guest, contract Lens, Arcade, Git/Markdown, EAP,
large-content, and mounted-filesystem traces. Commons venue and full EFS OS may
remain later without weakening Core.

## Superseded questions — never revive silently

### P-1 — Adopt the strong authority grade (two-lane kernel + admission receipts)?

Superseded as a July KEL-specific mechanism packet. The surviving requirement
is historical authority basis without retroactive reinterpretation; V2-E1 and
V2-E5 compare the smaller greenfield mechanisms.

### P-2 — Realm-qualified authority + how many realms ship

Partly answered: Realm-qualified state and standalone Core are adopted; no
single Commons/home chain is chosen. Exact launch topology waits for V2-E5 and
V2-E7.

### P-3 — The cross-realm consumption promise

Superseded wording. Portable semantic Records may be copied; admission,
authority, finality, revocation, and current state remain Realm/basis-qualified.
Foreign contracts need explicit local verification/commitment mechanisms.

### P-4 — Co-residency rule for filesystem vs OS/social venues

Answered by the 2026-08-12 layer boundary: Core is standalone; Commons and OS
are optional. Cross-Realm contract reads still need explicit adapters.

### P-5 — The re-home promise and the L1 pointer's disposition

No L1 locator or per-Principal home mechanism is inherited. Future managed
Principal succession/re-home behavior must re-earn inclusion after the MVP.

### P-6 — The four riders formerly bundled inside N1A

Superseded as a joined KEL packet. EOA and ERC-1271 local authorship plus future
rotation/recovery/delegation extension seams survive as requirements.

### P-7 — Ratify the consume-vs-build residual boundary

Superseded wording; V2-E1/V2-E5 now own the minimal authority/account boundary.

### P-8 — Recovery machinery locus

Deferred beyond the account-Principal MVP. The data model must reserve an
additive managed-Principal path without freezing recovery machinery now.

### P-9 — May a smart account BE ongoing control authority?

Reopened by the greenfield EOA/ERC-1271 requirement. V2-E1/V2-E5 must preserve
historical basis rather than banning current standards by assumption.

### P-10 — Does bare-EOA identity survive KEL inception?

The old in-place KEL formula is not inherited. Explicit association,
succession, or redirect evidence must not rewrite old Occurrences.

### P-11 — Chain-free mode: shipped, labeled product mode?

Not part of the Core MVP. Portable semantic bytes remain required; a local-only
product mode may be reconsidered in EFS OS.

### P-12 — Rung-label honesty as binding product law

The general honesty rule survives in the constitution; the old rung vocabulary
is not frozen.

### P-13 — Provider-attested freshness as an allowed labeled rung

Provider evidence remains expressible as an application Type; it is not a Core
authority shortcut.

### P-14 — Default head-anchoring posture

Superseded with the old local-mode mechanism.

### P-15 — Local-mode launch scope: single-principal realms

Superseded with the old local-mode mechanism.

### P-16 — The ordinary-app mount profile

The adopted three-host read-only mount outcome survives. Exact snapshot/live
product profiles remain evidence-gated and cannot redefine Core identity.

### P-17 — Subscribed-curator whiteout projection

Preserved as Lens/mount evidence, not a greenfield Core ruling.

### P-18 — Authority vs kind for the plain name

Preserved as a Lens/filesystem fixture, not a frozen resolver rule.

### P-19 — DA-tier bytes: internal rail or user-facing tier?

Superseded as a product-vocabulary question. Core keeps Locator, exact content,
closure, and availability distinct.

### P-20 — Ratify the tier-vocabulary honesty rule

The outcome survives: calldata/DA and provider bytes cannot be mislabeled as
state-readable on-chain bytes. Exact vocabulary is not frozen.

### P-21 — Cardinality scope: high-frequency telemetry out of v2's on-chain admission scope

Preserved as a workload limit: high-frequency raw telemetry uses aggregation or
another substrate, not unbounded Core admission.

### P-22 — Contract-readable wording

Answered more strongly: EFS Core is EVM-native and same-Realm contract-readable
under named bounded profiles. Cross-Realm facts require explicit adapters.

### P-23 — Permanence-hazard intake guardrails now

Preserved as a client/tooling requirement; no special Core record kind.

### LP-1 — Ratify the typed-lens constitution

The requirement survives: explicit purpose-scoped reader policy. The old Lens
grammar is not inherited; V2-E2 derives the smallest contract profile.

### LP-2 — The on-chain lens promise

Restated by V2-E2: bounded point/path resolution is the candidate floor; wide
sorted enumeration must earn separate mechanism and budget.

### LP-3 — Naming ratification

Superseded. “Lens” remains the human concept; `ResolutionPlan` is a current
candidate contract term.

### LP-4 — Lens-scale structure

Superseded by V2-E2's measured 1/8/32/64-Principal profiles.

### LP-5 — The anonymous/guest viewer's default trust grade

Guest direct access is adopted; exact starter/raw policy waits for V2-E6.

### LP-6 — Ratify the GATE profile's hard rules

Application/package gates remain pressure evidence. Discovery never authorizes
execution and the risk bearer chooses the policy.

### LP-7 — Personal-policy privacy default

Rich personal policy is OS/client-local and encrypted by default. Public
contract Resolution Plans necessarily reveal their policy inputs.

### LP-8 — The link-safety floor

Preserved as Web Client/OS evidence, not Core protocol bytes.

### LP-9 — Citation disclosure defaults

Preserved as client UX evidence, not Core protocol bytes.

### LP-10 — Computed membership

Computed/ranked trust is an OS/Commons policy input. Core consumes explicit
bounded Plans and never treats a computed list as self-authorizing.

### N2 — Constitutional system boundaries

Answered by the 2026-08-12 Core / optional Commons / direct Web Client / EFS OS
boundary. It does not automatically adopt the July Web OS thesis.

### N3 — Canonical private invitation discovery

Deferred to a privacy/application profile; no Core freeze consequence proven.

### N4 — Honest private-subtree behavior

Preserved as privacy/filesystem evidence; exact private profile remains later.

### N5 — Joined-system anchor application

Superseded as a single flagship choice. Arcade, Git/Markdown, EAP, Nanda,
mounts, contracts, and other cases jointly pressure-test Core.

### N6 — Ratify the reviewed privacy policy batch

The constitution preserves generic privacy seams and honesty. Exact old policy
and crypto profiles are not batch-adopted.

### Q1 — `seq` to `order` rename

Superseded with the old envelope grammar.

### Q2 — Always-present `claimedAt`

Superseded with the old record grammar; author time never proves chronology.

### Q3 / Q4 — still held

Remain historical issue inventory only. Re-open a narrow question if a current
prototype exposes it.

## Recording rule

When James answers a live V2 item:

1. append the dated answer and caveat to [[owner-rulings]];
2. mark the item here `ADOPTED`, `REJECTED`, or `DEFERRED`;
3. update [[system-constitution]] or [[core-architecture-candidate]] once;
4. add a [[Retirements]] row only for a searchable phrase the ruling kills; and
5. regenerate [[Open-Decisions]] rather than editing it by hand.
