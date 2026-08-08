# EFS v2 to 1.5 deep-dive corpus

**Date:** 2026-08-07
**Status:** supporting analysis for
[`../2026-08-07-efs-v2-to-15-deep-dive.md`](../2026-08-07-efs-v2-to-15-deep-dive.md);
review and design evidence, not implementation authorization or an owner ruling
**Scope:** the minimum EAS-backed bridge that fixes v1's irreversible identity
and graph problems without importing the native-v2 envelope, KEL, or full OS

#kind/review #status/done #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efs15 #topic/efsv2

## Contents

- [`v2-disposition-ledger.md`](./v2-disposition-ledger.md) — every major v2
  surface classified as **must backport**, **cheap seam**, **additive later**,
  **explicit debt**, or **reject for 1.5**, with authority status kept visible.
- [`v1-feasibility-and-migration.md`](./v1-feasibility-and-migration.md) — why
  universal IDs cannot be an SDK alias, the recommended sibling EAS profile,
  live Sepolia inventory, reuse/rewrite matrix, migration boundary, and fork
  proof plan.
- [`product-traces-and-acceptance.md`](./product-traces-and-acceptance.md) —
  Arcade, Nanda, Git-backed Markdown, ordinary files, and shared-schema traces;
  each names the smallest graph roles, read rules, and claims 1.5 may make.
- [`adversarial-review.md`](./adversarial-review.md) — independent architecture,
  implementation, product, and schema challenges plus the corrections folded
  into the main review and `Designs/efs15/`.

## Evidence boundary

The pass compares three evidence classes that must not be collapsed:

1. **What v1 actually does:** deployed bytecode and live state first, then
   current contracts/tests, accepted ADRs/specs, and SDK behavior.
2. **What the owner has directed for 1.5:** the 2026-08-07 rulings captured in
   [[Decisions]] and [[requirements-and-boundaries]].
3. **What v2 proposes:** current owner rulings outrank active requirements,
   which outrank reopened mechanisms and historical baselines. Nothing in this
   corpus silently promotes a reopened v2 formula into 1.5.

The live-chain observations are a point-in-time read at Sepolia block
`11,441,982`. They prove that v1 is not empty; they do not prove that all
records are valuable production data.

## Review method

Independent lanes were reconciled before publication:

- v2 invariant and source-precedence extraction;
- current v1 contracts/EAS/live-chain feasibility;
- product-trace red team across Arcade, Nanda, Git/wiki, files, and schemas;
- portable shared-schema and resolver preservation.

An ID-profile lane derived [[efs-id-1-candidate]], including concrete formulas
and recomputed smoke vectors. Final v2-invariant, EAS/schema-router, and current
v1/Solidity adversarial re-audits then forced the exact TypeDescriptor,
ShapeId/TypeId/binding preimages, on-chain execution descriptor, module
lifecycle, monotone record-activity rule, and coherent typed-reference fixture.
The result remains a draft until an independent Solidity/TypeScript
differential-and-fuzz harness and fork proof pass; this corpus does not pretend
those bytes are frozen.
