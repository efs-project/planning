# Real EFS state through an upgradeable foundation

**Status:** reviewed local disposable foundation; populated Lens/read integration
now passes, Files/browser join remains open
**Authority:** James approved fleshing out the prototype and validating the
foundation on 2026-09-08. No product repo, public deployment or protocol freeze.
**Parent plan:** [[Designs/efsv2/testnet-files-mvp-plan]]
**Starting source:** `83cbec4d0c991e945cce2c64a48bbcf9911ffcb5`, plus preserved
unfinished Binding-read changes. A pre-existing test-helper compile error was
repaired with an explicit bytes conversion; the five StateKernel baseline
tests then passed. The Binding increment is not thereby reviewed/completed.

## Question

Can controlled upgrades preserve actual EFS Type caches, immutable Records,
authored occurrences, Bindings, postings and file bytes while changing the
executing revision, refusing stale consent and preserving the original
interpretation of historical evidence?

This is a foundation test, not a new toy filesystem and not full C0 admission
conformance. Reuse the existing StateStore, StateKernel, PreparationHelper,
body/type validation, Binding fold and exact candidate Type inputs. The
legacy C0 admission entry remains revision-one-only. A new explicit internal
entry accepts the active revision checked by this host; old callers must not
silently change behavior.

## Deliberately narrow authority boundary

Use an explicitly named operator-signed fixture adapter, with an EIP-712
domain bound to chain and proxy and a payload binding the complete
publication, bytes, executing revision, nonce and expiry. The operator may
submit synthetic fixture authors. This tests non-transferable authorization
and replay/stale-plan behavior; it does not prove portable author authority,
ERC-1271/session support, full C0 WritePlan bytes or one real-wallet prompt.
The existing unauthenticated harness is not the new host's public entrypoint.

The upgrade controller is a local fixture standing in for a batch-capable
owner account. It is not a proposed production governance contract. It owns
actual OpenZeppelin ProxyAdmins, records an append-only ordered execution set
and activates the new revision atomically after upgrading both endpoints.
Test-only partial-upgrade entrypoints live in test utilities. Both endpoints
check the active set from U1 onward. Deliberately malicious upgrade authority
can replace these checks; this experiment does not claim otherwise.
Activation history includes both block number and actual admission high-water:
an old-revision write and the upgrade may share a block. The admission boundary
keeps their historical rules distinguishable without event-log dependence.

## Required experiment

1. Deploy locked implementations, initialized Transparent proxies, fixed
   libraries/helper and the fixture controller as an atomic pair-bootstrap.
   Use OpenZeppelin contracts 5.6.1, Solidity 0.8.30, Cancun, optimizer 200,
   via-IR and ordinary EVM size/transaction limits.
2. Populate actual EFS groups, valid ordinary Records, object/Binding state,
   automatic indexes and bounded content bytes. Reject malformed bodies,
   wrong references, unauthorized signatures, stale CAS and tampered bytes.
3. Retain raw state and a pending signed operation at U1. Upgrade Core and
   carrier to U2, adding a namespaced presentation field while preserving the
   EFS Store. Re-read the same IDs, bytes and old batch revisions; submit a
   new U2 operation and reject the pending U1 operation and replayed nonce.
4. Try a single endpoint upgrade without activation, failed migration,
   mismatched controller/peer configuration, initialization takeover and direct
   implementation use. Ordinary mutations fail closed and failed atomic
   upgrade leaves the complete U1 state/configuration intact.
5. Independently inspect on a managed loopback EVM: normal deployment size and
   gas; actual implementation slots; actual immutable ProxyAdmin evidence;
   retained Types/records/Bindings/postings; historical execution revisions.
   Do not normalize a revision-two receipt into revision one to reuse an old
   verifier. Unknown or absent historical evidence is not a successful check.

## Next use of the same prototype

Build a thin, bounded Files projection over this same Store: two authors with
competing names, a stable File Object, versioned content, rename/move masks,
remove/restore markers and authored tags. Render independently verified
results with a visible Lens and an explanation of selection/coverage. The
next task must consume real admitted state, not create a parallel authoritative
JavaScript file tree. Exact-Type evolution and missing/tampered evidence are
additional pressure cases, not promises of arbitrary old-app compatibility.
The [consumer checkpoint](consumer-checkpoint.md) fixes the next scenario's
expected outcomes and SDK/UX boundaries after the owning PMs' read-only review.

## Evidence ledger

- **September 9 current read increment:** [populated upgrade-aware reads](upgrade-read-verification.md)
  at `bcd0643`, with the ordinary test-config repair at `45f3667`, preserve
  the original Store and acceptance history. Parent 200 Core Forge, 19
  foundation Forge and 196 Node checks pass; five source-pinned snapshots and
  all 12 normal before/after query measurements reproduce. Task reviews and
  final increment review through `66f9da8` approve experimental publication.
  The next visible target is
  the [guest Files screen](../2026-09-09-v1-parity-overnight/consumer-build-card.md).
  Earlier counts, gas and headroom below describe their original checkpoints,
  not the current build. In particular, admission runtime margin is now
  43 bytes; it has not been solved by adding read libraries.
- [Validation-frontier canaries](validation-frontier.md): real direct-host
  tests demonstrate additive exact-Type coexistence, strict reference rejection,
  and why structural admission must not masquerade as Files validity. This is
  separate from upgrade evidence.
- Authored-current tags: four additional direct-host checks pass for an ordinary
  tag Type, two authors, deduplicated immutable content, untag/re-tag and exact
  stale-CAS rollback. Raw live occurrence counts are not current tag counts;
  see the same validation-frontier note for the measured scope.

- Upgrade contract component: implemented at `00588b4`; the controller
  reproduced all 14 new tests, covering populated upgrades, locked initialization,
  stale consent, atomic failure and same-block admission boundaries. Independent
  task review is Approved.
- Regression: the controller also ran all 162 current Core Forge tests, passing,
  including the five original StateKernel cases. This worktree contains the
  separately preserved unfinished Binding-read increment; passing tests do not
  review or complete that increment.
- Broad Node regression: **79/79 pass** across the current Core and foundation
  test files, including the exact-Type/tag canaries and managed upgrade checks.
  This likewise includes local Binding work and is not a claim that the whole
  historical branch or its uncommitted changes have passed independent review.
- Managed upgrade: the controller reproduced **11/11 passing Node checks**:
  source-pinned normal deployments, actual proxy-admin evidence, independently
  reconstructed retained state, same-block history, stale/altered/replayed
  operations, legacy-reader behavior, bounded history and exceptional cleanup.
  Task review, scoped correction review and final integrated review are Approved.
  See [the detailed verification and closeout](verification.md).
- The real seven-leaf small-file metadata publication costs **about 14.15 million gas**
  in the observed runs, leaving **about 2.63 million** below the experiment's 16,777,216
  cap. Byte staging is separate. Four candidate groups are installed separately;
  the largest group publication is approximately 14.54 million gas. Neither
  number includes a future FilesRouter or proves a one-wallet-approval path.
- Browser joins, full FilesRouter authorization/profile enforcement and real
  wallet UX: **not demonstrated by this checkpoint**. Contract component gas
  and managed transaction-receipt gas remain separate measurements.

## What this changed in the design

The important results are not just green tests:

- Preserve an admission boundary with each execution revision; block number
  alone cannot explain an old write followed by an upgrade in the same block.
- Expose exact-data validity, Files interpretation, executor support and
  committed effects separately. Structurally valid bytes can still describe
  an invalid filename or lack the required File/Directory charter.
- Resolve current authored tags through their current Bindings; retained live
  assertion occurrences are history/candidates, not a current-tag count.
- Keep operation sizing visible. The admission library has only **330 bytes**
  of runtime margin in this build, and full file creation has limited gas
  headroom. Measure the routed operation and atomic rename before adding more
  behavior to the same component or splitting an operation that must be atomic.

These are reasons to keep the same verified Store under the next thin
Files/Lens/SDK/browser join. They are not evidence of a completed filesystem,
an audited deployment or century-long compatibility. Exact-Type coexistence
is tested; automatic old-app compatibility still needs its explicit View or
projection fixture.
