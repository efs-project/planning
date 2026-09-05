# EFS 2.0 — owner decision inbox

**Status:** reference — compact live queue; mechanisms remain evidence-gated
**Audience:** James first; designers second
**Last reconciled:** 2026-09-04
**Inputs:** [[system-constitution]], [[core-architecture-candidate]], [[disposable-mvp-profile]], [[mvp-c0-genesis-manifest]], [[owner-rulings]], [[assumptions-and-requirements]], and the preserved July decision/review corpus in git history

#status/reference #kind/decision #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2

> **Nothing here needs an immediate owner answer.** James ratified the
> greenfield name and layer boundary on 2026-08-12. The current work is to
> prototype and pressure-test the candidate, then return only choices that the
> evidence cannot settle.
>
> James's 2026-09-03 direction supplies reversible MVP-C0 controls for the B0
> bundled Type/index arm and wallet-prompt target. Those controls are enough to
> run the experiment and are not permanent answers to V2-E1/E4/E5/F1/F2. Do not
> ask for the Type/query axis, carrier limit, Principal future, product scope,
> venue, or freeze merely to execute C0. James's later 2026-09-04 direction
> additionally authorizes local SDK/browser/Files/data/Arcade prototypes before
> product repositories exist. That does not authorize public deployment,
> permanent product release or protocol promotion.

## Decide after evidence — do not answer yet

### V2-E1 — Principal surface

Compare one uniform `PrincipalId` author/Lens/index API—with Realm-qualified
EOA and smart accounts represented as zero-setup account Principals—against a
tagged `Account | Principal` author reference. Return gas, setup, smart-account,
historical-authority, developer-complexity, and managed-identity migration
results. James's preference is one semantic Principal surface; it is not frozen
until the comparison proves it honest and simpler.

MVP-C0 temporarily exercises one intrinsic account Principal, retained EOA
witness verification, direct-transaction fallback, and one bounded/revocable
session grant. That evidence feeds this comparison without closing it.

### V2-E2 — Contract Lens floor

Prototype exact point/path resolution for public Plans of 1, 8, 32, and 64
Principals. Measure first/last/absent/conflict/unknown, cold and warm reads, and
risk-bearer policy. Evidence must distinguish this bounded Core promise from
wide sorted directories and rich private OS Lenses.

### V2-E3 — Record and shared-context bakeoff

Implement self-contained Records and minimal Records plus immutable
Envelope/Context normalization against the same Arcade, Git, EAP, Nanda,
Markdown, Topic/literal, and privacy fixtures. Compare calldata, storage, cold
reads, extraction, replay, archive closure, and clean-room reconstruction.

### V2-E4 — Type and index budget

Price the complete automatic Type/equality/typed-reference/backlink bundle,
including hostile hot values and decades of churn. Determine safe Type-creator
limits, canonicalization rules, page/basis/completeness ABI, and whether any
old on-chain query promise exceeds the aggregate budget.

The namespaced MVP-C0 Realm uses the B0 bundled Type/index arm plus
genesis-active `BindingScope` only as a control. No answer here is required
before that run, and its SDK seam must retain the later split profile.

### V2-E5 — Realm bootstrap and authority history

Specify and attack a self-contained Realm descriptor for a fresh L3, EOA and
ERC-1271 admission, historical implementation/authority basis, finality
observation, upgrade semantics, and independent state reconstruction. No
Commons or another chain may be required.

[[mvp-c0-genesis-manifest]] closes only the ordered local synthetic experiment
bootstrap. A permanent Realm descriptor, venue, upgrade policy, and operator
model remain this evidence gate.

### V2-E6 — Web Client and OS vertical slice

Local disposable browser implementation is now authorized (2026-09-04).
The [joined workflow lab](../../Reviews/2026-09-04-mvp-rehearsal/README.md) supplies
real contract/SDK/browser evidence for a smaller explicit `efs-lab/1` profile,
not full C0. Next bind the clean-browser direct guest File Browser to the
actual C0 Core/Files/SDK contract. Prove Web/OS
Files parity, no-Commons operation, honest `UNKNOWN`, tampered-primary
rejection, verified fallback, and the bounded write journey selected for that
product gate. Then decide permanent Web Client/OS packaging. Arcade may remain
one optional fixture; it is not a product or MVP dependency.

### V2-E7 — Commons venue criteria

Do not select a chain yet. First turn the adopted cypherpunk/CROPS boundary into
a measurable venue matrix: capture and censorship resistance, public
source/state, rule-change/governance risk, force inclusion, independent RPC and
node operation, finality, state availability, fees, walk-away reconstruction,
and exit/successor behavior.

### V2-E8 — Shared Types and validators

Run the focused portable-schema/validator pass against the minimal Type Schema
candidate. Prove reusable application semantics, structural validation,
records-by-Type, loss-aware EAS interoperability, recursive-Type safety, and no
arbitrary unbounded validator callbacks.

## Decide after evidence — freeze choices, do not answer yet

### V2-F1 — Freeze the minimum semantic protocol

Choose exact Type/Record/Occurrence/Context/Realm/Binding/Lens bytes, ID and
signature domains, canonical codec, index declarations, successor/coexistence
rules, and contract/module boundary only after cross-language vectors,
benchmarks, clean-room reconstruction, Fable 5 review, and independent
adversarial review pass.

### V2-F2 — First product implementation scope

Choose the first permanent contracts/SDK/Web Client release after the freeze
candidate proves the direct guest, contract Lens, generic Files, Git/Markdown, EAP,
large-content, and mounted-filesystem traces. Commons venue and full EFS OS may
remain later without weakening Core.

MVP-C0 and its later SDK/client acceptance overlays are experiment definitions,
not release authorization or an implicit answer to this choice.
The September local workflow rehearsal likewise does not close this gate;
its [build handoff](../../Reviews/2026-09-04-mvp-rehearsal/build-readiness.md)
separates immediately executable engineering from permanent release choices.

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
