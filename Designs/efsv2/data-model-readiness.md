# EFS v2 data-model capability and readiness map

**Status:** reference — requirements/evidence map, not feature-parity certification
**Target repos:** planning, contracts, sdk, client
**Last reconciled:** 2026-09-11

#status/reference #kind/note #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/requirements

## Read this first

The foundation should support useful shared data without making every developer
learn the full specification. Most peer-system capabilities already have a
written home in EFS; described, implemented in one component, and demonstrated
through an independent consumer are different states.

This map connects [[system-constitution]], [[layered-type-system-and-data-abi]],
[[programmable-type-acceptance]], [[hierarchical-files-and-folders]] and
[[testnet-files-mvp-plan]]. It does not replace their detailed contracts.
Peer evidence: [Reviews/2026-09-09-mud-and-validation-research](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-09-mud-and-validation-research.md). Current
source reconciliation and expert research:
[Reviews/2026-09-10-foundation-design-review](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-10-foundation-design-review.md). The subsequent
[Fable intake and parallel missions](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-10-next-foundation-round/README.md)
reconciles the later `0132e35` report and source repairs; its economic claims
were subsequently revisited in
[the cb6e76e economics/index/tag reply](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-10-foundation-reply-after-economics.md).
That reply supersedes the unused execution prompts, not the retained controls.
The earlier
[Reviews/2026-09-10-data-readiness-reconciliation](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-10-data-readiness-reconciliation.md) remains dated evidence,
including the old export defect; it is not the latest implementation inventory.

**Current conclusion:** enough structure exists to specify the next bounded
implementation experiment. Feature-complete data acceptance, authenticated
offline recovery, general Type tooling and real-wallet simplicity are not yet
proven. A usable local Files browser is significant progress, not proof of those
remaining capabilities.

**September 11 engineering checkpoint:** the
[[../../Reviews/2026-09-11-pragmatic-browser-pass|pragmatic browser pass]] now has
reviewed action-cost/recovery integration and an exact, COMPLETE 1,000-entry
reader result across three acquisitions. That listing still costs 838 HTTP
requests locally; remote browsing performance remains open. Fable's code-backed
Type cache reports roughly 10% lower repeated-admission gas, but an actual valid
large-Type admission test exposes its representation ceiling. Compact physical
cache design, declaration transaction fit and populated-layout migration must
be resolved before adopting that optimization. These are prototype findings,
not new restrictions on the Type language. The full clickable upload/download/
history walkthrough is being joined; it does not close the six foundation gates
below.

## Capability ledger

Evidence now distinguishes the PM intake baseline `1c5c374`, Fable Files
`cb6e76e` and standalone acceptance `e358ad66`; full source hashes and paths
are in the foundation review and subsequent intake. This refresh is source inspection and review of
retained results, not a fresh runtime rerun or merge of the three branches.
Designed, demonstrated separately, and demonstrated together are different
states; no row certifies feature parity or production readiness.

| Capability / useful precedent | Smallest appropriate EFS home | Current evidence and closing test |
| --- | --- | --- |
| Reusable exact Types, shape validation and generic contract reads — EAS/MUD | Core plus generated SDK accessors | Structural/index components plus standalone generated TS/Solidity and an independent consumer exist. Join a developer-authored Type to the actual Files Core; the flat-word lab is not the full layered Type language. |
| Mandatory arbitrary developer acceptance — EAS resolvers/MUD hooks | Generic guarded Core/Realm extension; ordinary application rule code | Demonstrated separately: Type-committed rules, explicit activation, Outfit/Equip and paid unique issuance. Join the upgradeable Core, Bindings and indexes; inventory every path claiming the same acceptance, including privileged migration. |
| Mutable state and application logic — MUD tables/Systems | Immutable Records + authored current Bindings + permission-limited controllers | Files lifecycle works locally. Run RPG state transition, race/CAS, rule update and grandfathering without a game-specific Core primitive. |
| Authority, actors and delegated sessions — EAS/MUD | Realm authority + reusable scoped grants + SDK wallet transport | Files has an EIP-1193 harness with reserved first-claim identity; the design already calls for derived account Principals. Two-user Lens onboarding, actual wallet software, smart accounts, prospective recovery and scoped delegation remain unjoined. |
| Atomic graphs, batches, idempotent retry | Core acceptance and explicit application transaction rules | Standalone rule/payment/Core-nonce rollback and duplicate execution exist. Preserve original-execution provenance on retry and join actual Files state. Outer transaction nonces/fees/delegation processing and earlier staging are outside rollback. |
| Compatibility and unknown-safe editing — AT Protocol | Exact Type/View contracts + SDK linter/editors | Standalone old-editor refusal exists. Useful additive reading/preservation still needs a joined trace. Unknown data may be preserved; unknown permission restrictions must not be ignored when granting authority. |
| Tags, backlinks, sets and qualified filters | Ordinary relation Types + Core declared indexes + Lens | `5037910` repairs silent unreadable tag display/filter/history paths; source inspected, suites not rerun in this intake. Aggregate composition and real consumer type checking remain open. Prove mixed image/video targets and negative filtering over a closed universe. |
| Index evolution, hot values and churn — MUD index modules | Core bounded query/coverage law; SDK pages; optional accelerators | 512 lifetime/48 live names require 2,988 requests in the retained run. Later-declared bitmap/backfill and K10 are proposed comparisons, not tested replacements. Validate ordinal domains, reverse lookup, tag-target changes, Lens masks, high-cardinality cost and complete observation-bound coverage. |
| Reactive synchronization and recovery — MUD | SDK browser-local snapshot/delta cache + replaceable services | Qualified readers exist; complete reorg/provider-switch/backfill convergence is not demonstrated here. Never make an EFS server authoritative or mandatory for the static SPA. |
| Generated APIs, package composition and generic inspection — MUD/ComposeDB | One SDK Type-package workflow + Explorer | Bounded codegen and static inspection now exist separately. Integrate into the existing five seams and Files/Explorer; ordinary data access must retain the qualifications its claims need. |
| Provider-independent bytes and complete export — IPLD/AT Protocol | Exact content/closure profiles + SDK exporter/verifier | V1 export repairs internal integrity. Actual checks do not establish selected currency/listing completeness or offline authorship. Add authenticated query reconstruction and nested recovery; a genuine header does not authenticate fabricated RPC answers. |
| Revocation, withdrawal, expiry and deletion | Core lifecycle + explicit application and Files semantics | Local remove/restore works. Test issuer revocation versus holder rejection versus carriage withdrawal; none means erasing public history. |
| Private data and publication safety | Encrypted-body profile + client/OS sensitivity and key handling | Detailed boundary exists; public browser is not private-folder evidence. Unsupported encrypted mounts remain opaque/unsupported, never falsely empty. |
| Affordable storage and recoverable custody | State-readable canonical graph plus replaceable bulk-byte carriers | Fable now reports 3.01M fresh-chunk gas and opcode/slot profiling; fresh versus identical-restage explains the prior discrepancy. The new tag component totals and fresh-slot classification still need one retained reconciled baseline. A/B/C are engineering directions to compare packing/context/dedup/code-backed bytes; preserve future generic reads and distinguish current execution from proposed-fork repricing. |
| Upgradeability and long-lived history | Versioned Realm implementation/activation and state-readable receipts | Populated U3 repeat upgrade passes locally. Historic acceptance still needs exact rule/config evidence; retained privileged fixture entrypoints remain declared exceptions, not production defaults. |
| Host filesystem usability | Shared Files reader plus read-only host adapters | Linux/macOS/Windows outcome is required. This browser pass does not replace the three-host golden view test. |
| EAS import/export and external identifiers | Versioned adapter + explicit loss receipt | Required design seam, not identity-preserving round-trip proof. Preserve original schema/UID/chain evidence and explain missing policy/currentness. |

The ledger deliberately does not add mandatory full-text search, global ranking,
GraphQL servers, a game engine, a general ontology interpreter or arbitrary code
execution during reads to Core. They can be useful application/service/SDK
features. Their absence from Core is not itself a missing data-model primitive.

## Everyday developer and data UX

The target workflow is **define → generate → preview → accept → inspect → evolve → export**.
These are workflow verbs, not seven new SDK entrypoints. Retain the SDK's
existing five-seam division and let generated helpers compose it.

- Define a Note/Outfit Type using friendly names and an exact dependency package.
  Opt into a mandatory rule when custom acceptance is required.
- Generate consistent TS and Solidity helpers, including exact identity,
  validation diagnostics and the ordinary inspection description.
- Preview locally, then authorize a clearly scoped plan. Simulation is advisory;
  contract acceptance and independent read-back establish the result.
- Inspect ordinary fields first. Expand an evidence panel for Type identity,
  required rule, author/actor, Realm/basis, lifecycle, coverage and raw bytes.
- Evolve through a tested compatibility path. Old readers may read supported
  projections; old editors preserve unsupported data or refuse editing.
- Export an explicitly selected scope with separately reported listing,
  content and authority/evidence completeness. A folder download is not
  automatically recursive or independently authenticated.

Do not make every read revalidate all ancestors. Retained exact structural and
acceptance evidence can be reused for the claims it actually proves. New actions,
current eligibility, lifecycle, destination acceptance or a different trust
policy require their own checks. Missing evidence remains unknown.

## Five joined examples, not another large framework

| Example | Cross-layer acceptance obligation |
| --- | --- |
| Note extension | Note 1.1 adds an optional field; old reader projects known fields; old editor preserves new data or refuses. Rule changes cannot hide behind a minor-version label. |
| Media tags | Image and video share an attributed `ocean` relation. Lens selects whose tags matter. Missing index coverage does not mean “not ocean”; content verifies through a second independent source. |
| RPG outfit | Custom code validates pieces and current eligibility. A rules update leaves historical items intact; explicit policy decides grandfathering and new equips. Paid/unique claims roll back together. |
| Contract consumer | Independent Solidity uses generated helpers to select exact Type/rule/activation and risk-bearer-approved Lens, without trusting a web server or running admission hooks during ordinary reads. |
| Lost publisher | Export exact records, descriptors, content and required evidence; fresh verifier reconstructs within the declared scope. Tamper, missing dependency and fabricated authority/basis fail or downgrade distinctly. |

## Ordered build-readiness gates

The integrated recommendation remains a generated, contract-validated Note used
by two fresh users. The foundation review sharpens the parallel design tests;
this list is not permission to begin runtime work in a research-only session.

1. **Join acceptance and generated consumption to the actual Core.** Preserve
   the standalone Outfit/paid-claim controls; inventory direct, relayed, imported,
   bootstrap and upgraded paths. Check exact rule/activation, original execution
   evidence and rollback scope. Profile-pair acceptance remains a comparison.
2. **Make qualified composition the ordinary path.** Validate constructors and
   serialized continuation; attack unknown tags, counts, filtered exports and
   negative queries. Then demonstrate additive Note reading, safe old editing
   and independent Solidity/browser agreement through the existing SDK seams.
3. **Replace reserved identity with genuine onboarding.** Two fresh authors and
   deliberate Lens inclusion; actual wallet software and separately counted
   setup/sponsor behavior. Compare prospective recovery and scoped delegation;
   refuse unknown restrictions. No silent signature-plus-transaction fallback.
4. **Compare current reads and all-in costs.** Fixed live set with increasing
   distinct-role history; aggregate pages versus current candidates; retained
   whiteouts; index backfill/reorg/rebuild. Count inspected work, writes, bytes,
   proof material and first useful/complete latency, not only RPC requests.
5. **Authenticate selected-state recovery.** Nested export with independent
   anchor policy, required state/code/evidence and selection/coverage interpreter.
   Test coherent omission, stale revisions, real-header/fake-answer attacks and
   loss of original publisher/provider. Destination reacceptance stays distinct.
6. **Join private visibility and recovery.** Encrypted subtree must remain
   opaque when unsupported/locked; private completeness names its manifest and
   scope. Separately restore signing authority, ciphertext and decryption keys;
   measure residual metadata leakage and any explicitly selected proof profile.

Each gate produces a small reviewed change, independent read-back and a short
user-visible trace. Reuse Fable's working browser and retained C0 controls.
Do not freeze IDs, create permanent repositories or adopt a universal callback
ABI merely to run these gates. Existing E1–E8/F1/F2 remain the owner routing;
this map is not a fresh questionnaire or a demand for perfect verification.

## Maintenance

Update a capability row only with an exact design, executable test or explicit
scope decision. Preserve the dated evidence underneath it. At each checkpoint,
ask: did the ordinary workflow get simpler, did a known requirement lose its
enforcer, and can an independent consumer demonstrate the claim?
