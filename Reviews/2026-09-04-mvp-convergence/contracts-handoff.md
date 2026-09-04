# Proposed Contracts Dev handoff

**Status:** proposed engineering handoff from independent read-only review; no repository creation or product implementation authorization
**Sources:** September MVP-C0 `12ef4c5`, August readiness `2573f08`, with the September seam repairs tracked in this [run](./README.md).
**Reviewer:** temporary `contracts_handoff` subagent; integrated by v2-pm, 2026-09-04.

## Reuse the harness pattern, not a supposed finished Core

August's `Reviews/2026-08-25-efs2-exp-c0-v0-control/` is useful evidence for
independent vector emitters, Solidity encode/decode parity, coordinate
mutation tests, coverage labels and serialized consumer handoffs. Its tests
are not an implementation of September MVP-C0.

Specific non-reusable shortcuts in that snapshot:

- `src-sol/ExpC0TransitionControl.sol` exposes separate `registerType` and
  `registerRecord` paths and accepts an injected `bool authorized` verdict.
  September requires SR-17 ordinary admission with atomic Type-cache
  materialization, actual witness verification and retained evidence.
- The limited literal-tuple Type parser is not the complete Files grammar.
- The old domain/result/limit vectors describe EXP-C0/v0, not MVP-C0.
- JavaScript dependency resolution through the sibling v1 contracts package
  is not an isolated, reproducible build. The next executable package must own
  its dependency manifest and lockfile.

V1 can supply operational lessons—artifact drift checks and explicit network
configuration—not an EAS baseline, protocol ABI or deployment topology.

## Smallest useful engineering structure

This is a proposal for an approved implementation location, not creation of a
new repository or a permanent choice of name.

```text
src/          experimental Core, byte carrier, internal codecs
test/         unit, mutation, fuzz, invariant and joined traces
reference/    independent encoder and state-only reader
fixtures/     exact bytes, rejected cases and source locks
scripts/      measurement, bootstrap, artifact export and retirement
artifacts/    reproducible consumer bundle; separate non-secret run evidence
docs/         scope, assumptions and one build/run guide
```

Continue the already explored Foundry/Solidity and Node test arrangement as a
candidate. Pin actual compiler, Foundry, Node, dependency, EVM-revision and
optimizer settings before a run; the old control's compiler/fork settings are
reproduction inputs, not newly chosen defaults. One local check entrypoint and
CI should invoke the same checks. No generators for managing agents.

## First three independently reviewable tickets

| Ticket | Deliverable | Acceptance |
|---|---|---|
| 1. Exact-byte/build boundary | A locked disposable package; explicit run-only manifest, capability, Type-group and grant codecs; independent Solidity/JS digest vectors | Clean isolated build; exact parity; omitted/reordered/trailing/substituted/overflow inputs reject. Member indexes are frozen before Type IDs. No public deployment. |
| 2. Measured carrier and bootstrap | Finite measured run caps; atomic initialization/seal; mandatory indexes and BindingScope; SR-17 admission; G0–G12 transcript | Independent readers agree at the exact seal transaction; illegal phase writes leave state unchanged; runtime remains closed until verified activation. |
| 3. Joined write and recovery | Synthetic directory/file/revision; relayed EOA, direct fallback and bounded same-Principal session; independent read-back | CAS/replay/domain/expiry/grant substitution and revoked/over-budget attempts reject without mutation; verified listing/bytes and state-only recovery. Wallet prompt claims require separate real provider/browser evidence, not Solidity tests. |

Do not make ticket 1 wait for final permanent topology, venue, recovery, all
application profiles or century-scale evidence. Do make it finish the exact
run encodings that two implementers would otherwise invent differently.

## Consumer artifacts

Export ABI, creation/runtime bytecode and hashes, compiler input/settings,
source commits, exact codecs/domains, capability/Type vectors, and a separate
run manifest with actual addresses and commitments. An ABI alone proves no
deployed compatibility. Regeneration must be byte-identical.

Preserve raw bytes beside decoded values, wide integers, profile discriminators,
qualified results and distinct authorization/submission/effect/read-back
receipts. Keep `EXPERIMENTAL_DIRECT_CORE` and
`filesPreconditionCertified=false` explicit. Consumers import serialized
artifacts, not the implementation's own helper functions as their oracle.
Exclude secrets and machine-local paths.

## Remaining bounded engineering work

Before G0, concretize manifest integer/count widths and lengths, exact
capability/Type/root bytes, the grant codec and enforceable budget meanings,
deployment-factory assumptions, proof-reader dependencies and measured caps.
These are named run-spec tasks, not proof that the permanent architecture is
undesignable and not invitations to choose production defaults silently.

The current run may design and test those seams. Production repository creation,
candidate product implementation and public deployment remain separate
authorization questions. No such work was performed by this review.
