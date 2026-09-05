# MVP build-start engineering pass

**Status:** authorized overnight engineering in an isolated planning experiment.
**Baseline:** `1a51c5d728766f25d31fcf7575e578dca3aaf780`.
**Spec:** [engineering inputs](../2026-09-04-mvp-rehearsal/engineering-inputs.md),
[repository blueprint](../2026-09-04-mvp-rehearsal/repository-blueprint.md), and
the linked current C0/Stage A designs. James requested an elegant SDK, static SPA,
and well-designed contracts. This pass implements the previously recommended
bounded build-start work; it does not reopen product discovery.

## Global constraints

- Work only in the assigned planning worktree. No product-repo creation,
  permanent IDs, public deployment, main merge, or protocol promotion.
- Preserve `efs-lab/1` versus full C0 explicitly. A wrapper does not upgrade the
  lab's semantics. All nine M0 rows stay unclaimed until actually executed.
- No hidden chain, authority, signing, network, submission, or retry defaults.
  Missing/provider failure remains UNKNOWN; incomplete pages remain PARTIAL;
  transaction inclusion is not independently verified effect.
- Browser delivery is static: no SSR or required EFS application backend.
  Explicit Ethereum RPC, content providers, wallets and optional relayers are
  dependencies, not evidence that the SPA has a privileged server.
- Keep source files focused. Reuse the current experiment without copying its
  entire SDK or contract. New round output lives here unless a task explicitly
  names a small integration edit.
- Tests first for new behavior; record the observed expected failure and passing
  command. Do not use the encoder under test to manufacture expected bytes.
- Root integrates and commits exact paths. Workers do not commit, change shared
  tracking files, spawn reviewers, or edit another lane's files.

## Task 1: SDK ergonomics proof

**Owner/files:** SDK worker, `sdk/` under this directory only.

**Goal:** demonstrate a small, pleasant TypeScript-facing API over the explicit
lab adapter that can later accept a real C0 adapter without disguising profiles.
Read the existing rehearsal `sdk-design.md`, `sdk/index.d.ts`, implementation,
and repository blueprint. Keep pure reads, write preparation, wallet approval,
submission and verified completion conceptually separate. Prefer composition
and narrow types over a new general framework or a second codec implementation.

1. Write consumer examples first: list/read a file; read a typed record; prepare
   and complete a write with explicit approval policy. Include partial/unknown
   branches and cancellation/uncertain submission without automatic resubmit.
2. Add focused failing runtime tests and compile-time negative examples for
   mistakes that the proposed public API should prevent. Use Node, TypeScript
   and installed dependencies from the prior rehearsal; add no dependencies.
3. Implement the smallest facade and explicit adapter needed. Do not modify the
   old SDK. Preserve detailed original evidence behind every friendly result;
   verified success must require the existing SDK's independent read-back.
4. Document package/subpath responsibilities and the exact consumer-visible
   calls. Identify anything made longer by safety constraints rather than
   hiding those constraints. State what remains application responsibility.
5. Run focused runtime tests plus strict TypeScript checks and self-review.

**Acceptance:** runnable examples/typechecks, no wallet needed for read-only
construction, no implicit writes, no success from submission alone, cancellation
fenced before approval/submission, precise evidence preserved. A JS caller gets
runtime boundary checks as well as TypeScript guidance. Adapter remains named
lab-only. Put commands and limitations in `sdk/README.md`.

## Task 2: Static SPA delivery proof

**Owner/files:** SPA worker, `spa/` under this directory only. Existing rehearsal
source is read-only; report any small essential shared edit to root first.

**Goal:** serve the existing Files/Data/Arcade application as static files with
an explicitly separate development transport. Do not rebuild the UI or create
a production authentication server. Read the active bootstrap/workflow app and
demo server, not only the inactive first-checkpoint `web/app.mjs`.

1. Specify a static deployment configuration boundary. Use relative assets and
   hash routes suitable for a subpath/IPFS-style static host. A deployment's
   manifest/RPC endpoints are explicit; secrets and synthetic signing keys must
   never enter the export. Keep optional development gateway unmistakable.
2. Write a failing browser/export test for a fresh static origin independent of
   the local development RPC/wallet gateway. Exercise Files/Data navigation and
   deep reload under a non-root prefix. Assert actual browser behavior and
   network destinations, not source-string snapshots alone.
3. Implement a minimal export/bootstrap harness reusing current source. Show
   which capabilities work with direct browser RPC and which still need an
   injected wallet or explicitly optional relay. Do not fake completed writes.
4. Test absence of configuration, failed provider, deep routing, and a normal
   read path against the real local lab when feasible. Keep provider failures
   honest and preserve the existing sandbox/security/cancellation boundaries.
5. Document exact build/serve/test commands, static output contents and a small
   deployment boundary diagram if useful. Avoid SSR, service-worker lifecycle
   expansion or general bundler migration in this pass.

**Acceptance:** a real static export loads and navigates from a prefixed origin
without the application server serving pages or injecting per-request state;
no secrets are bundled; the explicit backend/RPC dependencies are accurately
reported. Put results and limitations in `spa/README.md`.

## Task 3: Exact C0 Type engineering inputs

**Owner/files:** Core worker, `type-inputs/` under this directory only.

**Goal:** replace the outstanding prose-only inventory with machine-readable
inputs and executable format checks, before implementing Core admission. Read
the exact Stage A SR-17/MC encoding chapters and current C0 genesis/Files models.

1. Resolve the sixteen-Type inventory in the baseline engineering-inputs doc
   against authoritative field layouts. Record source sections and any remaining
   specification ambiguity; do not hash a paraphrase and call it canonical.
2. Create explicit versioned temporary descriptor inputs, preserving field
   roles, closed references, indexes and limits. Where the spec fixes values,
   reproduce those values; where a lab choice is required, label it as such.
3. Write failing tests for group order, exact byte consumption, malformed or
   substituted member/index, reference closure and carriage bounds. Emit group
   bytes with one encoder and parse/recompute independently. Literal small
   vectors must be independent of the emitting implementation.
4. Materialize as much of the genuine descriptor inventory as the specification
   supports. If an ambiguity prevents honest encoding, report the exact missing
   field/decision and implement the unblocked parts; never invent hidden bytes.
5. Report encoded sizes, IDs explicitly qualified as temporary/source-pinned,
   and which exact artifacts Core/SDK can consume next. Keep actual admission,
   initialized state and full C0 separate from descriptor arithmetic.

**Acceptance:** reproducible machine-readable input artifact and independent
checks, or a sharply reduced exact gap list with working unblocked artifacts;
no nominal C0 claim from laboratory schema IDs. Put commands, provenance and
limits in `type-inputs/README.md`.

## Task 4: Contract execution-budget comparison

**Owner/files:** root, `contracts/` only. This executes the baseline engineering
input's already requested bounded-subcall versus entry/exit-meter comparison.
Use one fixed controller/semantic contract and Core-only carrier, not arbitrary
validator calls or a new authority design. Demonstrate atomic rollback, finite
payloads, aggregate exhaustion, unauthorized callers and underfunded execution.
Measure separate local transactions as well as Solidity tests. Distinguish
charged allowance, work-region gas and whole transaction gas. Document a
recommendation and its exact limitations; neither arm is full C0 conformance.

## Integration and review

Root will inspect each lane for spec compliance and quality, arrange independent
cross-boundary review, run all new suites plus the existing lab regression set,
and publish one concise handoff. The SDK and SPA remain independent wrappers of
the same source-pinned lab; the exact Type inputs are not silently substituted
into its five-tag laboratory grammar. Product PMs may review their surfaces in
their own worktrees without changing this experiment.

Completion means reviewable engineering artifacts and a smaller honest queue,
not complete C0 or production readiness. Next real-contract milestone remains
initialize → admit typed data → create a file → independently read it through
the SDK and static browser.
