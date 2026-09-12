# Canonical Types in the cheaper filesystem: registry gate

**Standing:** September 12 disposable prototype result; independently reviewed
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
