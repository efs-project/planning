# Canonical Types in the cheaper filesystem: registry gate

**Latest result:** the canonical native Files integration is independently reviewed
and root-reproduced; see the dated integration closure below. No protocol adoption.

**Initial registry-gate standing:** September 12 disposable prototype result; independently reviewed
and root-reproduced. The direct registry works. Native Files/SDK integration
and its whole-operation price are the next task, not an earned result yet.

## Why this matters

The cheap native filesystem was limited to three simple approved validators
and prototype-specific content IDs. This experiment reuses the fuller model's
actual structural Type interpreter without importing the entire publication,
authorship and collaborative-selection machinery. It tests which useful
properties can be composed with inexpensive contract-owned Files.

Task 1 now deploys a separate pinned interpreter and a canonical Type registry
under ordinary code-size and transaction limits. The registry keeps exact Type
group bytes and immutable compiled caches; it validates bodies and constraints
against those exact Types. It does not invent a second grammar or silently
accept unsupported reference/index obligations.

## What passed

Source/support is frozen at `6d1afce9fe2a3b279a5852c32c9ec3db220e0f6a`;
executable registry/helper source is unchanged from reviewed `a5937cf`.
The [complete receipt report](https://github.com/efs-project/planning/blob/df2a26c143fd6727ad20233f2d7b324b78d70bd5/Reviews/2026-09-11-efs21-pragmatic/evidence/canonical-registry-task1.md)
and its linked raw artifacts are retained at evidence commit `df2a26c`.
The final retained package contains 90 signed local-chain transactions, 16
actual Type caches and 45 body outcomes. It covers successful scalar/nested
validation, malformed schemas/bodies, unsupported references/indexes, resource
refusals and rollback when the second cache deployment fails.

Independent review authenticated source/runtime/receipt/cache associations and
the complete six-source compiler output. Root reproduced seven focused tests,
including a fresh finite helper/registry world and offline evidence checks:
seven passed, zero failed. The earlier root regression gates remain 124
classified native Forge tests and 214 shared Core tests. Historical native
control tests are separate; Task 1 did not make the current Files/browser graph
green by weakening its old source-identity checks.

| Direct operation | Gas used |
|---|---:|
| One-time interpreter deployment | 4,169,079 |
| Registry deployment | 1,800,274 |
| Register the default two Types | 1,081,225 |
| Repeat the same registration | 339,264 |
| Validate a uint256 quote | 97,288 |
| Validate empty length-framed bytes | 98,090 |
| Validate depth-four nested data | 105,317 |
| Validate 64 boolean members | 353,193 |
| Validate an array of 1,024 uint8 values | 804,100 |

These are complete direct transaction receipts, not isolated execution-only
gas and not whole File operations. Shared interpreter setup should be priced
separately from each user's writes. No matched cost saving is claimed yet.
Interpreter runtime is 19,032 bytes; registry runtime is 8,058 bytes. Both
deploy normally, including their complete creation input.

## Boundaries that remain visible

- This first profile rejects references, roles, external Type dependencies and
  declared indexes. A PRINCIPAL-shaped word is not proof of authorship.
- Generic canonical Record storage and Files integration have not happened in
  this result. Content identity portability will not make the native File ID
  or caller authority deployment-independent.
- The canonical body limit remains 4,096 bytes; the default bytes Type uses a
  two-byte length, leaving 4,094 payload bytes. This is a prototype profile,
  not the permanent Type language's limit.
- Some legal large Types still fail cache/output/gas budgets. A legal large
  single cache was refused; the large aggregate actually exhausted the bounded
  helper call. Neither is advertised as supported.
- Checked member reads currently revisit the whole Type group. Their cost
  sensitivity deserves measurement; tiny-group results do not price all Types.
- Retained local receipts and code are reproducible evidence, not chain-state
  proofs or production readiness. The three running browser demos are unchanged.

## Next discriminator

Execute Task 2 of the [[2026-09-12-efs21-canonical-native-types-plan|reviewed integration plan]]: actual native Files, contract producers/consumers, optional
Discovery and the source-qualified SDK use the new Types together. First prove
the complete deployed graph fits. Then compare identical application payloads
and operations against the frozen native control, including setup, writes,
paid reads, browser qualification and failures. Keep raw versus length-framed
representations and different content IDs explicit.

The full model's [[2026-09-12-efs21-typed-read-facet-plan|typed read-facet split]]
is separate. It addresses code placement without changing storage semantics;
it must not be confused with reducing write amplification or with this narrower
filesystem's measured price.

## Targeted follow-up: validate the schema once, each new body every time

A source-only independent review identified a smaller potential cost reduction:
ordinary member reads currently copy/hash the whole stored group and walk every
member span, although successful registration already established those links
and this exact registry has no setter, proxy or delegatecall path to change them.
The first experiment should reuse only that registration-time origin check.
Keep unknown/reserved-Type checks, inexpensive association checks, exact cache
bytes/hash/header checks, helper identity and bounds, and actual body validation.
Keep the full registration/repeat path. This changes neither Type IDs nor the
meaning or validation rules of new data. No savings are measured yet.

The safety premise is the actual immutable registry/helper/cache lifecycle, not
"Cancun makes contracts immutable." Storage can still change through code, and
same-transaction SELFDESTRUCT remains a special case under
[EIP-6780](https://eips.ethereum.org/EIPS/eip-6780). The pinned cache constructor
only returns STOP-prefixed data and has no callback or destruction path.

This would deliberately weaken one diagnostic: a test that forcibly corrupts
only stored raw-group bytes could stop being detected by an otherwise valid
member lookup. Preserve and report that changed fault outcome; do not delete
the test or call it identical behavior. Any reachable attacker operation that
changes a trusted association, or any changed valid/invalid-body result, rejects
the candidate. SDK raw-group/cache and chain/basis qualification is separate;
neither repeated local consistency checks nor cached code prove an RPC truthful.

After the current integration is frozen, a small separate A/B can price the
default group and a longer-description group with the same field shapes. Use
identical declarations/bodies within each pair, full registration/lookup/valid
and invalid-body receipts, and explicit cold versus twice-in-one-transaction
reads. This is a staged hypothesis, not permission to alter the active Task 2
control or an adopted reduction in EFS validation guarantees.

## September 12, 13:14 UTC — integrated Files checkpoint

Task 2 now has actual canonical Records through native Files, the browser/SDK,
contract producers/consumers and optional Discovery. Source/support is
`b2eae00589b1f174b29df0f18e9a8aa97330f918`; local evidence-only closure is
`e10ad67cc4936adf005c046f59b8e434fcc2e716`. **Independent review is still open;
these commits are not yet published.** This supersedes the earlier next-task
status above, not its narrower semantic scope.

Root reproduced 159 native Forge tests, 214 shared Core tests, 56 Node tests
(including actual canonical and historical browser workflows), and 8 shared
body-reader tests: zero failures or skips. The worker initially reported 234
Core tests; the reviewer and root independently summed the retained table and
corrected that arithmetic to 214. The suite and assertions did not change.

The complete deployment fits ordinary limits: Files runtime 10,724 bytes,
Record kernel 2,946, Type registry 8,058 and interpreter 19,032. Index modules
are separate contracts. The final pair contains 193 signed transactions and
54 matched primary operations. Root's fresh pair reproduced every signed
transaction, gas/status/calldata and deployment inventory exactly. Both finite
worlds and their caches were cleaned; existing browser demos remain frozen.

| Same application operation | Old simple-validator profile | Canonical-Type profile |
|---|---:|---:|
| Create quote File | 560,868 | 627,672 |
| Edit quote File | 228,331 | 295,135 |
| Contract updates its quote File | 131,941 | 198,745 |
| Unrelated contract reads quote path/Type/value | 80,769 | 80,613 |
| Create tiny binary File | 525,938 | 593,592 |
| Rename | 246,691 | 246,508 |

Gas is complete local transaction gas, not dollars. The canonical interpreter
adds roughly 67,000 gas to these scalar writes; this integration is a capability
gain, **not another gas reduction**. Paid Files/history/directory/Discovery
reads were effectively unchanged in the measured small workload. Setup costs
and raw-versus-length-framed byte boundaries remain separate in the full pair.
Neither arm includes the full model's portable authored publication and plural
Lenses, so neither prices those guarantees away.

The reviewer has requested focused evidence for candidate-only Discovery
attachment edge cases and saved-journal File create/edit recovery. No product
bug is established by those coverage gaps. Review closure remains required
before treating Task 2 as complete. Large legal caches/aggregate groups still
hit the explicitly measured representation/gas limits; those were not fixed.

## September 12, 13:28 UTC — integration closed for prototype publication

The two requested coverage gaps are closed by tests only: candidate Discovery
checks constrained/nonscalar rejection, another exact UINT population and cache
corruption; saved canonical create/edit journals recover after lost submission
or verification responses, without resending. No implementation workaround was
needed. Scoped re-review and fresh whole-bridge review approved the disposable
integration with no remaining actionable finding. This is not production approval.

Final source/support is `b8c27754314c97ab48c5b2454f9be05653e6b393`;
[published evidence](https://github.com/efs-project/planning/blob/d269e5560d23af169e386f8ad92d9a5f60a9c382/Reviews/2026-09-11-efs21-pragmatic/evidence/canonical-types-review1.json)
and its bounded gzip inventory are at `d269e5560d23af169e386f8ad92d9a5f60a9c382`.
Root reran 162 native Forge and 58 Node tests: zero failures or skips; shared
Core214/body-reader8 remain verified against unchanged source. Root's fresh
193-transaction pair exactly matches final signed calldata, gas/status and
deployment inventory. All54 primary comparisons remain the table's original
economics. The added test file also supplies the benchmark fault driver: only
its compiler metadata changed, lowering two test-only deployment receipts by12gas
each. That is disclosed separately, not called a product saving.

The three demos are still their old frozen snapshots; this closure does not
silently upgrade them. Final test worlds and owned caches were stopped/removed.
The code remains on the authorized prototype branch, not merged into planning/main.

**Next engineering priorities:** implement the already reviewed typed read-facet
split in the fuller Core, then resume its index-store comparison; separately
price the immutable-registry reuse hypothesis and adapt the staged live-file
experiment to the new canonical profile. Code modularity, schema-cache capacity
and repeated storage/validation costs are three different jobs. No large legal
Type support, reference support or full portable-authored/Lens parity was added
by this integration, and none is silently waived.
