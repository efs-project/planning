# What overhead are we actually choosing?

September 12, 2026 · execution criteria for [[README|the path decision sprint]] · not benchmark results or protocol approval

## The answer we must earn

For the chosen guarantee profile, report the **best demonstrated complete cost**, what each important capability adds, how cost grows, which cheaper alternatives were tried, and what remains unexplained. That is enough to make an informed engineering choice. It is not a proof that no future engineer can improve it, nor a permanent dollar price.

Do not call the present seven-record recipe, journal, signature format, storage layout or module graph unavoidable. Equally, removing a guarantee to measure its price does not authorize shipping without it.

| Label | Evidence required |
|---|---|
| Conditional lower bound | State the exact execution, persistence, availability and verification assumptions and justify the bound. A bare mapping measurement is a diagnostic, not a mathematical minimum for EFS. |
| Best demonstrated implementation cost | Complete receipt-backed operations passing the same semantic expectations, with required setup, queries and recovery accounted for. This is the actionable price of an implementation. |
| Marginal capability cost | Matched counterfactuals with an explicitly different guarantee. Include interactions. Calling a premium accepted requires an owner decision, not merely measuring it. |
| Avoidable or still-unpriced work | A same-guarantee replacement demonstrates avoidable work. Without that replacement, the suspected waste remains a hypothesis or unpriced integration—not a necessary feature tax. |

## One common semantic fixture, independent checks

Freeze the inputs and expected results before candidate integration. Use the same canonical small quote/note, checked pair/item reference, stable subject, two authors, history, required folder/tag queries and selection rules. Specify retained historical evidence separately from current authority. A genuine producer contract must not be represented by an invented EOA signature.

Shared semantic libraries can isolate a storage comparison, but the independent oracle must not simply call the same encoder/verifier and declare agreement. Physical representations may differ, including MUD's packing. A candidate need not reproduce today's inefficient seven-record storage recipe, provided it reconstructs the same promised meaning and its reconstruction is priced.

Begin with three probes, shortlisted and sized within the mission clock:

| Probe | What is held constant | What it decides |
|---|---|---|
| Fuller-model engineering | Existing meaningful operations, required queries, normal deployment/execution limits | Test the largest plausible same-guarantee reduction. Establish modular deployment first only where it blocks that measurement. Routing/byte-copy savings alone do not explain the full semantic overhead. |
| Compact portable slice | Canonical typed publication, checked reference, mandatory developer acceptance, required queries and explicit authority/selection semantics | Price portable authored evidence and two-principal selection on a compact implementation; test whether representation—not feature removal—accounts for savings. |
| MUD substitution | The same semantic fixture, validation, evidence, outputs and query coverage as the eligible custom contender | Determine whether World + Store, or a justified Store-only boundary, reduces maintained infrastructure at acceptable complete cost. No new EAS implementation. |

### Counterfactuals that answer the feature-cost question

For the compact slice, retain a small diagnostic **authorship × independent selection** matrix: neither, authorship only, selection only, both. Hold the data, direct caller authentication and existing history/navigation constant. A counterfactual missing a required capability is diagnostic only, not an eligible finalist.

For each operation, report the interaction:

`interaction = cost(both) - cost(authorship only) - cost(selection only) + cost(neither)`

Do not add separate premiums when hashing, context bytes, signatures or indexes share work. Repeat only at the small number of payload/batch sizes that can change the decision. A shared immutable publication context or a batch may amortize cost; include its setup and the cost of extracting/verifying an individual item.

For indexes, compare **two implementations of the same promised query**: for example a materialized structure versus bounded reconstruction from retained authoritative state. Removing the query is a sacrifice experiment, not an index optimization. Charge writes, hot-value updates, late backfill, reads, coverage bookkeeping and worst supported churn. Requiring an off-chain indexer is a changed operational/trust contract, not a free saving.

For data carriers, compare identical availability/verification profiles or label the changed guarantee. Hashes plus unavailable payloads cannot stand in for contract-readable data. A live contract-backed file and a retained immutable revision are separate operations; price both without pretending they provide interchangeable history.

## Record costs the owner and implementer can use

Eight to twelve named complete operations should cover setup, first create, repeated edit, native producer update, required discovery, paid point/list/history reads, import and a late failure. Pin exact variants before measurement. Use the small shared fixtures plus the dense/zero larger pair when it discriminates storage strategies.

Each row records:

- Source, bytecode/configuration/fork, exact guarantee profile and operation input.
- Transaction receipt gas, including staging, sponsored transactions and failures; setup separately.
- Paid consuming-contract read gas; browser RPC counts, batches, bytes and measured latency separately.
- New persistent words/bytes, code accounts and postings per new/reused Record, authored action, edit and Type; lifetime versus current population.
- Mandatory external obligations: relayer/account execution, index maintenance, data retention, proof generation/verification and rebuild work. Identify who pays.
- Maintenance burden: custom code/interfaces we must own, dependency/version obligations, privileged/audit surfaces and migration responsibilities. Support qualitative comparisons with the actual component inventory; do not invent engineering-hour savings. This is part of MUD's potential value even if its runtime is not the cheapest.
- Verified result and any absent, incomplete or unpriced obligation.

Receipt totals are authoritative for the measured transaction. Internal gas checkpoints and operation counts help explain them but may overlap or alter execution; reconcile any residual instead of inventing an exact additive pie chart. Avoid huge traces or retained node databases.

Show read-heavy, write-heavy and recovery/churn-heavy workload mixes. A lifecycle model may combine measured setup, writes, reads, listings and rebuild work only within the measured regime; do not extrapolate linearly through nonlinear churn. Report crossover points and sensitivity to chain fees/DA assumptions. Disclose regressions and paid-read costs even if writes improve.

**There is no owner-approved universal gas or dollar ceiling yet.** Show the resulting costs for understandable workloads and recommend an affordability envelope. Ask James only if a real feature/cost conflict survives engineering. Do not manufacture a passing budget after seeing the measurements.

## The one-finalist gate

The same deployed graph must connect:

**portable authored typed action → mandatory acceptance → required index update → Lens-selected Files result → unrelated Solidity and clean-reader consumption → export/import → historical read after a rule/account/Core change.**

Include a genuine contract author, two conflicting authors, invalid/missing reference rejection, stale CAS, failed mandatory-index rollback and one unavailable carrier. Test direct, batch, import and dedup/reuse entrypoints for bypasses. If application callbacks claim effects or payments, test exactly-once effects and late-failure rollback too; do not add a payment feature merely to satisfy a test.

Historical contract-author validity must not be inferred from today's mutable account validation response. Retained source acceptance is not automatic destination acceptance. Name the witness, chain-state proof or trust assumption actually used; matching IDs and a retained RPC transcript do not upgrade the proof level.

The finalist must also show understandable SDK calls and a Files journey against its actual contracts. A polished substitute UI or disconnected passing libraries do not close the integration gate. Wider privacy, account recovery and schema/carrier limits need concrete extension/failure analysis, with unresolved load-bearing cases carried explicitly.

## Converging to one, without freezing blindly

Select **one primary architecture and next implementation sequence** when its required semantics and joined slice hold, complete operations fit the proposed budgets, no material recurring obligation is hidden/unpriced, and the recommendation survives plausible workload mixes. Test the strongest remaining cheaper representation or counterexample before concluding that the measured premium is worth accepting. Record why the runner-up lost; stop developing it unless a named result reverses the decision.

If a material unknown remains, name one primary hypothesis with a blocking experiment, not three equal futures or an unsupported claim of readiness. The 48-hour checkpoint must say whether we can start reversible testnet implementation and why. It must not manufacture a permanent winner from an expired timer.

Before **permanent freeze**, separately require the complete authority/replay/recovery story, cross-language identity vectors, independent reconstruction/proof scope, adversarial review, legal-schema/resource limits, long-horizon growth analysis and explicit version/coexistence rules. “We can upgrade testnet” is not an answer to those questions.

| Meaning whose continuity must be designed now | Things that can evolve only through explicit compatible boundaries |
|---|---|
| Exact semantic bytes/IDs and what signed claims assert | SDKs, generated wrappers, UI, transports |
| Historical authority and acceptance interpretation | New versioned rule activations and successor Types |
| Required query outcomes, basis and completeness | Additional optional indexes, caches, query implementations |
| Content/closure commitments and retained evidence | Carriers, replicas and proof tooling |
| Coexistence and recognition rules | New deployments and explicitly compatible adapters |

This is not a promise that a frozen contract's internal storage or index layout can be replaced. Mark each actual mutation right: testnet-admin change, append-only registration, replaceable external service, or new deployment. An independently deployed successor can preserve old evidence without assuming a permanent administrator may reinterpret it in place.

## Initial evidence state

The [[../2026-09-11-efs21-overnight|fuller/native comparison]] and [[../2026-09-12-efs21-canonical-native-types-results|canonical integration]] contain useful receipt-backed implementation deltas. They do **not** price equivalent portable authorship, checked references, programmable acceptance and multi-author selection across both arms. Those costs are still unpriced for the comparison. No new gas result or finalist eligibility is claimed by this protocol.
