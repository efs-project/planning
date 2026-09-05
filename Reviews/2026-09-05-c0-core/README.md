# Joined C0 Core implementation track

**Status:** in progress — disposable local implementation toward the full C0 MVP, not a completed profile or a production repository.

This is the continuous integration home after the published
[Type-admission checkpoint](../2026-09-05-c0-admission/README.md). Keep adding the
missing pieces here instead of declaring a succession of disconnected probes
to be the MVP. The existing `efs-lab/1` browser remains a usable separate demo;
its passes cannot substitute for the exact C0 acceptance rows.

## Finish line and order

The controlling specifications remain the [C0 profile](../../Designs/efsv2/disposable-mvp-profile.md),
[ordered genesis](../../Designs/efsv2/mvp-c0-genesis-manifest.md),
[five SDK seams](../../Designs/sdkv2/mvp-interface.md), and
[nine joined acceptance journeys](../../Designs/web-client-os/mvp0-acceptance.md).

1. Consume the real admitted Type caches to validate application Record bodies;
   add generic reference resolution and the declared index obligations.
2. Implement atomic multi-leaf admission, Binding CAS/history/no-resurrection,
   and genesis-active BindingScope. Keep the author, actual signer and payer
   separate; preserve canonical bodies and retained authority evidence.
3. Materialize the exact Codex/capability inventory as those capabilities are
   implemented, then join the real Core and carrier through G0–G12. A list of
   desired capabilities is not evidence that they are implemented. No opaque
   replacement commitment counts as completed initialization.
4. Connect the bounded contract Lens and Files kernels: empty root → atomic
   small-file creation → exact path/bytes/complete listing → rejected stale-CAS
   update with all Core state unchanged. Then close all three mutation paths.
5. Wire the same Core into the typed SDK, static SPA and separate Data Explorer.
   Run all nine C0 journeys with independent reconstruction and wallet traces;
   distinguish synthetic signature tests from actual wallet UX evidence.

Each increment records tests, failure analysis, design refinements and the next
unfinished requirement. The full goal stays active until the integrated finish
line is supported, not merely because the current increment passes.

## Architecture choice for this iteration

Use small source modules with one atomic mutation boundary. Reuse the tested
descriptor parser and carrier where their contracts fit; do not copy the old
admission probe wholesale or make its temporary commitment the new Realm.
First separate pure body parsing/extraction from stateful target lookup and
effects. The same extracted values feed validation, indexes and Binding
interpretation; the SDK must not implement a second state mutation path.

Compared with extending the schema-only probe, this avoids inheriting its
one-author/one-leaf restrictions. Compared with a genesis-only shell, it builds
the capabilities that genesis must actually prove. Physical linking versus
inlining is measured once the joined runtime exists; it is not a permanent
contract-topology decision.

The [Codex integration notes](codex-integration-notes.md) close a source-scope
ambiguity before bootstrap: the C0 account-support overlay must be explicit,
not a B0 module falsely advertising unimplemented verification paths. They
also identify the exact capability/group-root/session bytes still to build.

## Completed body checkpoint

[Application-body validation plan](body-validation-plan.md): a reusable Solidity
validator and an independent JavaScript reader exercised against actual admitted
Type caches. Fresh controller checks pass: 21 Solidity tests and 15 Node tests,
including 39 independently identified valid/malformed body comparisons. See
[verification and retrospective](verification.md) for review status, component
resources, repaired design seams and remaining gaps.

This closes structural body parsing/extraction only. It does not
claim stateful target validity, Files semantic validity, completed application
admission, G3 capability activation, or any C0 browser row.

## Current stateful increment

The [stateful increment](stateful-integration.md) records the state owners,
exact dispatch rule and twelve adversarial acceptance cases for application
admission, Binding and postings. Its [implementation plan](stateful-plan.md)
has completed the pure key/effect helpers at `e10bc56` plus review fix
`0c3b9ee`: 39 Solidity and 15 Node regression checks pass, with independent
task review closed. See the [stateful evidence and retrospective](stateful-verification.md).
Next is one atomic stateful kernel, then an independent state reader. The
bounded input/dependency/readback interfaces and SDK transaction-correlation
requirements are pinned in the plan. This remains unfinished capability work,
not a completed C0 acceptance claim.

## Owner followups

None needed to continue reversible local engineering. Later, actual-wallet
participation and any product-repository/public-deployment/permanent release
authority must be requested precisely when needed. No general Type-system or
venue questionnaire is reopened by this work.
