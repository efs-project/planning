# Programmable Type acceptance

**Status:** draft — recommended comparison target; no ABI or permanent mechanism selected
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[system-constitution]], [[core-architecture-candidate]], [[layered-type-system-and-data-abi]]
**Supersedes:** —
**Reviewers:** Codex `validator_design_review` and `data_capability_review` (2026-09-10; independent advisory passes recorded in [Reviews/2026-09-10-data-readiness-reconciliation](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-10-data-readiness-reconciliation.md))
**Last touched:** 2026-09-10

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/requirements

## Problem

A schema developer must be able to supply code that rejects data before it
acquires the schema's acceptance guarantee. Structural decoding alone cannot
enforce compatible RPG equipment, issuer authority, uniqueness, proof checks,
or paid issuance. Optional client checks and endorsements are different features.

The earlier blanket exclusion of Type-selected admission code was stronger
than the requirement to bound execution. This draft reopens that mechanism;
it does not reopen whether ordinary reads must remain bounded or whether
historical acceptance may be silently reinterpreted. The evidence and peer
comparison are in [Reviews/2026-09-09-mud-and-validation-research](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-09-mud-and-validation-research.md).

## Proposal

### Simple public model

> A Type describes the data and names any mandatory acceptance rule. A Realm
> runs an identified implementation of that rule when accepting a publication.
> Later readers can see what passed, where, and under which rules without
> running arbitrary developer code again.

An accepted record is not necessarily true, endorsed, available, or usable
forever. It passed a particular program under particular conditions. A malicious
Type author can publish a permissive rule; nominal identity and consumer trust
still matter. A failed rule never becomes accepted merely because the bytes fit.

### Three approaches, one recommended experiment

| Arm | What the developer/consumer names | Tradeoff |
| --- | --- | --- |
| **A — recommended** | Exact Type with mandatory rule commitment, or explicit no-rule | Selecting the Type selects its required rule. Changing fixed rule meaning changes the exact Type; generated names hide identifier ceremony. |
| B — retained comparison | Exact `(Type, AcceptanceProfile)` pair | Data identity can survive a profile change, but every accepting API/query must retain the pair. Omitting the profile cannot mean it passed. |
| C — deployment pattern | Controller-gated application writes | Useful for complex operations. Equivalent only when A or B makes that controller gate mandatory; a convenient optional router is not a substitute. |

Arm A is a design recommendation, not a frozen Type preimage. Compare A and B
on the same developer and contract-consumer traces before V2-E8/V2-F1 closes.
Do not implement three public SDK frameworks to perform this comparison.

### Identity and local execution

These are conceptual fields, not serialized structures or additional Core kinds:

| Concept | Commits to | Does not establish |
| --- | --- | --- |
| Exact Type | Meaning, shape/representation, mandatory RuleId or explicit no-rule, other selected Type obligations | Current eligibility or endorsement |
| RuleId | Immutable rule definition/artifact contract, input/result semantics, fixed parameters and declared dependency semantics | That any contract claiming this ID is equivalent |
| Rule activation | RuleId, local executor and implementation/configuration revision, dependency bindings, execution profile, resource policy | Cross-chain equivalence or timeless behavior |
| Acceptance receipt | Existing occurrence/Realm/authority facts plus exact activation, action/context commitment, order and observable execution basis | Future finality, current validity, or automatic destination admission |

Portable Type/Record identity excludes an accidental local deployment address.
The local executor binding still needs verification: the first experiment uses
immutable executors, reproducible deployment artifacts and explicit dependency
bindings. A Realm accepting an arbitrary self-declared RuleId is not verifying
the rule. A top-level codehash alone is insufficient for proxies or mutable
dependencies. Unsupported or unverifiable bindings refuse the acceptance claim.

Fixed semantic parameters belong in the rule commitment. Deployment wiring and
its evidence belong in the activation. Deliberately varying game state, balances
or a policy administrator are declared dependencies of the rule, not changes
to its bytes. If a rule delegates future policy to an administrator, that power
must be visible; an immutable Type does not make that policy immutable.

Pinning is an enforcement contract, not trusting an executor's ID getter. A
binding profile names which runtime, immutable configuration, proxy/dependency
bindings and execution environment it actually verifies. It must not claim a
complete dependency closure by inspecting a top-level codehash or a self-reported
manifest. General developer code can depend on local mutable state; accepting it
under an explicit dependency policy does not certify chain-independent results
or make those dependencies immutable. Unsupported verification profiles refuse
their claimed grade, rather than silently falling back to address equality.

Distinguish rule rejection, execution failure/resource exhaustion and missing
binding evidence in diagnostics; all refuse acceptance, but they establish
different facts. Compare moving operational gas caps into the exact activation
instead of permanent Type meaning. Arbitrary EVM programs can observe gas and
fork-specific behavior, so that move is not automatically semantics-preserving:
the actual execution profile and resource policy stay pinned in plans/receipts.
No operational limit or identity preimage is changed by this recommendation.

Changing fixed rule meaning creates a new RuleId and, in arm A, a new exact
Type. Changing an executor/configuration binding creates a new activation and
requires the rule's binding policy to permit it. Historical receipts retain the
old activation. A destination Realm rechecks local conditions or stores the
source receipt as source-qualified evidence; copying bytes is not reacceptance.

Callbacks themselves are not incompatible with portability. EAS supplies a
useful mandatory-acceptance precedent; its stored old attestations are not
automatically revalidated by a changed resolver. The EFS obligation is to retain
exact historical rule/execution evidence and avoid treating a present address as
timeless meaning. See the source-qualified comparison and EAS correction in
[Reviews/2026-09-10-foundation-design-review](https://github.com/efs-project/planning/blob/aae282df72f214d791963aeac1cf3c38d162c56e/Reviews/2026-09-10-foundation-design-review.md).

### One guarded acceptance boundary

Every entrypoint that can grant the same acceptance status reaches one guarded
commit boundary: direct, batch, relayed, imported, controller-mediated,
reused-record, privileged initialization, migration and upgraded paths.
Accepted-index entries and effective Bindings cannot appear through a weaker
side path. Raw retained evidence may exist separately but never masquerades as
accepted data in queries or generated application APIs.

The hook receives Core-authenticated context: candidate Type/body identity,
occurrence/publication, effective Principal and actor, action/plan commitment,
Realm revision, activation, and separately identified payer/submitter where
relevant. Exact input size and accessors are measured before choosing an ABI.
Rule code cannot substitute caller-supplied identity for verified authority.
The stateful executor itself authenticates its bound Core/coordinator; supplied
context alone is not authentication. Direct calls and lookalike coordinators
cannot consume rights by forging the context. A separate read-only preview may
be public without granting acceptance or performing effects.

Use one extension point with two declared modes:

- **Read-only:** bounded `STATICCALL`, for arbitrary developer checks that do
  not modify state. Reading mutable contracts makes the result time/state-dependent.
- **Stateful:** bounded ordinary `CALL`, for consumption of one-use rights,
  payments, uniqueness reservations and dependent effects. The transaction
  must roll back these effects with failed acceptance.

Neither grants `delegatecall` access to Core storage. Success requires an exact
bounded result; false, revert, no code, malformed/oversized output or exhausted
resources refuse. The wrapper caps copied return/revert data and preserves
enough gas for safe failure. Rule gas does not replace limits on Core state,
body size, references or index growth. One hostile Type must not prevent
unrelated Types from making progress.

For stateful hooks, payment/value allocation is explicit and authenticated.
No recipient refund callback or hook can reenter another Core mutation path.
External code's writes remain ordinary same-transaction EVM effects, not a grant
of EFS authority. Cross-chain effects are outside this atomicity guarantee.
Every stateful plan accounts for all supplied value. A duplicate carrying fresh
value is rejected or returns it under the explicit policy, never silently traps
or transfers it. Specify unused allocation and refunds; test insufficient/excess
value and reverting/reentrant refund recipients. Failed acceptance reverts
participating application payments, reservations, Core replay nonces and
index/Binding effects within the same reverting execution boundary. Outer
transaction nonce/delegation processing, protocol fees and previously committed
staging remain outside that guarantee. In particular, EIP-7702 pre-execution
delegation processing can persist despite execution failure; wallet/account-
abstraction adapters must state their own outer accounting boundary.

### Batch observation and idempotence

Recommended baseline: structurally check the bounded plan first, then process
items in signed order; each hook observes earlier staged items, and any failure
reverts the whole transaction. This is **not** validation against one unchanged
transaction pre-state. A receipt identifies the plan and item order; block
number alone does not identify intermediate state.

Forward references may identify proposed records without proving those records
have already been accepted. A whole-plan invariant belongs to an explicit
bounded transaction Type/controller rule, not an accidental promise of every
multi-record envelope. Compare the required plan-input extension using the
Outfit/paid-issuance fixtures; do not add a general transaction interpreter.

Reusing immutable bytes can avoid repeated canonical decoding/hash work. A new
occurrence, Realm, author, payment, or action still runs required acceptance.
An exact duplicate of an already accepted operation returns its original result
only after operation identity is established; it must neither accept a new
operation nor charge again. Expired or revoked authority is not revived by a
cached body check. Failed later items roll back earlier application payments/
reservations, Core replay nonces, accepted receipts, Bindings and index effects
together within that execution boundary; they do not undo external staging or
transaction-level processing described above.

A Type rule gates its declared acceptance events, not every later reference to
its Records. An application-effective transition such as equip requires a new
accepted action occurrence or an operation-bound mandatory gate. A generic
Binding to an old Outfit is not evidence of an accepted new equip action.
Ordinary graph linking remains permissionless; application consumers must check
the transition evidence before granting application authority.

The rule contract names the actions it governs, including custom issuance,
revocation or renewal where needed. One simple representation is ordinary
Issue/Revoke/Renew action Types sharing rule code; their accepted occurrences
drive the application's lifecycle fold. Core carriage withdrawal does not
silently invoke or replace application revocation policy. This preserves
EAS-class lifecycle customization without making every reference a callback.

### Reading and developer experience

Keep four questions distinct in the SDK and Inspector:

1. Can these exact bytes be decoded under this Type?
2. Was this publication accepted under the required rule and named activation?
3. Is it still effective under the relevant lifecycle at the requested basis?
4. Does this consumer trust it for this purpose?

An ordinary generated accepted-data reader checks retained acceptance evidence;
it does not invoke the rule again. Raw decoding/browsing remains available with
an explicit weaker result. A Type-only raw query must not silently upgrade
structural matches to accepted publications. Consumers pin allowed activation
policies where local execution or external dependencies affect safety.

Local preview/dry-run validation helps explain likely rejection, but state can
change before inclusion. The contract remains authoritative. Return bounded
machine-readable error codes plus optional untrusted diagnostic text; do not
let diagnostic decoding turn unknown failure into success or execute code.
These operations fit the existing SDK plan/authorize/submit/read-back seams.

### Worked application laws

| Workflow | Required behavior |
| --- | --- |
| Note 1.1 adds a field | New exact Type; compatibility tooling verifies the promised old-field contract. An old editor preserves unknown content or refuses editing. Version labels alone prove nothing. |
| Outfit: goblin plus ice shirt | The custom rule rejects the proposed equip action, including raw direct submission. Valid shape alone is insufficient. |
| RPG rebalance | Prior item/acceptance remains readable. Existing equipment remains or changes according to explicit grandfathering policy; a new equip action checks current rules. |
| Paid unique award | Two racing or same-batch claims cannot consume one authorization twice. Rejection rolls back payment and effective state. Issuer revocation differs from holder rejection and carriage withdrawal. |
| Import to another Realm | Preserve exact bytes/source provenance; run destination acceptance before claiming destination acceptance. Different executor addresses are not automatically equivalent or incompatible. |

Ordinary application Types express these operations. No `Goblin`, `Award`,
`Skill`, or other application-specific Core noun is introduced.

## Acceptance tests and falsifiers

The following are required tests, not results produced by this design pass:

| Test | Failure that rejects the candidate |
| --- | --- |
| Custom Outfit rule through every entrypoint | Invalid data acquires the same accepted/effective status by avoiding the hook. |
| Accepted bytes reused with new context | New author, Realm, payment or action bypasses a required check. |
| Batch rollback and duplicate replay | Later failure leaves earlier effects; exact retry charges twice; changed operation reuses an acceptance. |
| Hostile hook/recipient | Reentrancy mutates Core, oversized returndata exhausts the wrapper, or events/independent reconstruction disagree with committed state. |
| Hook caller and application-use spoofing | Direct/lookalike-coordinator calls consume rights, or a raw Binding to an old Outfit impersonates a newly accepted equip action. |
| Payable value conservation | Duplicate-with-value, excess/unused allocation or failed/refunded batches trap or transfer value outside the declared policy. |
| Missing/changed executor | Unsupported binding passes, or a code/configuration change silently rewrites old acceptance meaning. |
| Independent Solidity consumer | Another contract cannot distinguish structural decoding from exact rule acceptance without executing developer code during ordinary reads. |
| Game update | Old items become unreadable, grandfathering authorizes unrelated new actions, or current eligibility is silently cached forever. |
| Portability and recovery | Source acceptance becomes destination acceptance automatically; required rule artifacts or activation evidence cannot be reconstructed from the declared closure. |

Run the read-only and stateful arms on the same local testnet fixture, then
connect one custom Type to generated TS/Solidity helpers and the browser. No
production deployment or frozen IDs are needed to obtain that evidence.

## Open questions

All feed existing V2-E8/E5/F1 gates; none is a new immediate owner questionnaire.

- [ ] Compare A with B on API omission risk, Record-ID churn and recovery cost.
- [ ] Specify the exact rule-artifact/binding-verification contract and supported
  dependency model; do not claim arbitrary cross-chain program equivalence.
- [ ] Measure ordered-item observation versus the minimum whole-plan input
  required by the selected application transactions.
- [ ] Fix supported stateful effects, value accounting, gas/return limits and
  failure ABI after hostile-hook and rollback tests.
- [ ] Demonstrate immutable historical receipts across activation/Core upgrades
  and an explicit current-lifecycle reader.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [x] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

The standalone `codex/programmable-acceptance` experiment at
`e358ad66bb6471e1d89b1327d03c5ba7a286b116` demonstrates the Type-committed-rule
arm, explicit activations, ordered rollback, generated TS/Solidity consumers
and safe old-editor refusal. Its `Reviews/2026-09-10-programmable-acceptance/`
README, results and design-followthrough are separate-branch evidence, not
integration into the upgradeable Files Core. The profile-pair arm remains a
comparison, general dependency equivalence is not proved, and useful additive
editing is not established by refusal. [[data-model-readiness]] tracks the join.

This changes the next design comparison, not the frozen meaning of any existing
prototype Type. Retain existing C0/Fable evidence and use a named new experiment
revision for programmable acceptance. Implementation begins with the smallest
rule boundary and adversarial tests, not a full new storage implementation.
