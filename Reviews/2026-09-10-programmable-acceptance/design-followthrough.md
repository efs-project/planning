# Design implications of the acceptance experiment

**Status:** provisional engineering interpretation; tests/reviews are recorded
separately in `results.md`. No owner promotion, identity freeze or production
ABI is implied.

## What an application developer should understand

A Type describes what fields mean and which rule must accept a new publication.
The developer writes ordinary contract code for that rule. EFS checks shape,
authenticates the actor, executes the named local rule and records the outcome
in one transaction. Generated helpers handle byte encoding and identifiers.

An Outfit can remain a readable historical item after a game rebalance. Putting
it on today is a separate Equip action and may fail today's rule. A game may
explicitly let already-equipped items stay equipped. Merely linking to an old
Outfit is not proof that a new Equip passed. None of this needs a Goblin or
Game primitive in Core.

Likewise, an accepted paid claim proves that the declared rule accepted that
claim and consumed its local right/payment at that execution. It does not make
the issuer trustworthy, the claim true, or the right unconsumed on every chain.
Those are distinct policy and cross-Realm questions.

## Concepts kept, concepts avoided

| Kept | Why it earns a place |
| --- | --- |
| Exact Type | Field meaning, representation and mandatory rule cannot drift beneath an old identifier. |
| Rule commitment | Callers cannot omit custom acceptance just because the bytes fit. |
| Exact local activation | The same portable definition can be deployed at different addresses with different local authority/state. That difference must be visible. |
| Authenticated ordered plan | Establishes who authorized what, in what order, with which value and local execution constraints. |
| Retained acceptance receipt | Ordinary readers can verify historical acceptance without running the developer's code again. |

Avoided: a new application-specific Core kind, arbitrary runtime interpretation
in readers, a first-writer-selected default executor, a general dependency or
cross-chain equivalence engine, a generic refund callback mechanism, and a
second full SDK. There is one accepting writer rather than separate semantics
for direct, batch, imported and controller-mediated data.

## Mandatory Type-rule versus mandatory Type/profile pair

The laboratory implements the first arm, not two competing stacks.

| Question | Type commits rule (implemented arm) | Mandatory Type/profile pair (comparison only) |
| --- | --- | --- |
| What ordinary code selects | A generated Type binding, including its mandatory rule and exact local activation | A structural Type, mandatory profile and exact local activation |
| Can an API omit the rule/profile? | Not while naming the same ruled Type | Only if every accepting API refuses an omitted profile; raw Type reads must remain explicitly weaker |
| Fixed rule change | New Rule and exact Type; record identity changes if it commits Type | Structural Type/record identity may survive; acceptance identity still changes |
| Local deployment/configuration change | New activation; no automatic equivalence | New activation; same obligation |
| Old data | Retain the old exact Type/rule/activation evidence | Retain the old exact Type/profile/activation evidence |
| Tooling risk | Generated helper must not hide which activation is trusted | Every generated helper, query, cache and consumer must preserve the pair |

Recommendation for the first real implementation: keep the Type-committed rule
unless evidence shows substantial user value in accepting the *same exact
structural record* under several mandatory profiles without new Type identity.
Do not add an optional-profile escape hatch in the meantime. A structural View
or compatibility projection is not a substitute for either acceptance model.

## Rule identity is not a program-equivalence theorem

The supplied rule runtimes can avoid local addresses in immutable runtime bytes
and put local constructor bindings in separately committed storage. That permits
identical code and fixed semantic configuration to share a Rule commitment across
deployments. An exact activation additionally names the coordinator/chain,
executor, local configuration and resource policy.

Checking code and a binding getter does not discover all hidden state or prove
that arbitrary proxy/dependency implementations are equivalent. The inspected
fixture rules expose a small, declared binding and policy surface. A consumer
still chooses trusted Type/rule code and local activation. Unsupported general
bindings should not gain a stronger guarantee through introspection alone.

The first-registration attack illustrates why this matters: a matching codehash
does not make an attacker-selected administrator trustworthy. Exact activations
remove the global first-writer choice; they do not remove the consumer's policy.

## History, ordinary reads and current eligibility

Keep these claims separate in generated outputs and inspection:

1. **Decoded:** the retained bytes match a known exact shape.
2. **Accepted then:** this coordinator recorded the exact rule/activation and
   application basis after authenticated execution.
3. **Effective now:** the application's lifecycle/current-selection policy says
   the action still has effect at the chosen basis. This does not follow from 2.
4. **Trusted here:** this consumer accepts that author/rule/activation for its
   purpose. This does not follow from 1–3.

New acceptance invokes the rule. Reading old evidence does not. A source receipt
copied to another Realm remains source evidence until a destination admission
passes its own required boundary. Same bytes do not supply new eligibility,
payment, permission or local uniqueness.

Read-back must also distinguish first execution from idempotent retrieval. A
retry transaction has a new block but returns the original accepted receipts.
Another permitted relayer may even execute a plan before the application's
apparent first submission. Retain original execution evidence; do not overwrite
historical block/submitter with the retry's transaction metadata. If that
provenance is unavailable, the SDK can still expose qualified historical reads
while leaving the complete write journey UNKNOWN/reconciliation-needed. It must
not invent a successful new execution or charge again to repair an ambiguous UI.

## Deliberate limits and follow-ups

- The flat finite ABI-word shape is a generator/acceptance control, not a final
  replacement for the layered Type system, nested records, reference closures,
  automatic indexes, Lenses or the existing Files schema.
- Numeric caps and gas settings are measured fixture policy, not 100-year limits.
  If the experimental Rule commitment includes a gas cap, evaluate moving
  operational budgets into activation policy before freezing identities; raising
  a venue budget should not silently redefine semantic compatibility.
- Exact funding/no refunds makes failure accounting small and testable. A real
  sponsor must disclose who pays. ERC-20 payment, asynchronous/cross-chain
  effects, refunds and account abstraction need their own integration tests.
- Intrinsic account authorization is not the managed Principal/session/recovery
  design. No arbitrary first-claim ID ownership is imported from the Files fixture.
- Upgradeable testnet integration must preserve old receipts and exact activation
  history and inventory bootstrap/migration/operator paths. This small immutable
  coordinator does not replace the existing populated-upgrade experiment.
- An old editor may safely refuse a new exact Type. That is an honest first
  implementation, not proof that arbitrary additive revisions are automatically
  backward-compatible or round-trip editable.

No new owner questionnaire is needed to test these choices. The measured,
reviewed evidence should feed the existing V2-E8/E5/F1 gates; permanent adoption
and production/public deployment remain human-gated.
