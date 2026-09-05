# Application-body checkpoint verification

**Status:** controller tests, both task reviews and final joined review pass. Structural parsing evidence only.

This increment continues from published `4d09403` in the same owned
`codex/mvp-c0-coherence` worktree. No prior candidate bytes, admission probe,
historical measurements or `efs-lab/1` browser were changed.

## Fresh controller verification

- Task 1 at `95b406d`: the controller independently ran **21 Solidity tests,
  all passing**, including 128 runs each of the two fuzz tests. The independent
  task reviewer approved specification and quality with no findings.
- The implementation's test-first sequence observed failing literal BOOL
  cases, then failing additional-kind/constraint cases, before their passing
  implementations. Tests assert exact numeric rejection codes and exact
  canonical slices/reference output, not merely a generic revert.
- All fourteen MC/1 kinds, valid/invalid UTF-8, full-width signed/unsigned
  constraints, strict encoded MAP ordering and reference budgets are covered.
  All four unchanged candidate groups derive caches through the actual parser;
  representative application bodies consume them.
- Task 2 at `6d9c59a`: the controller independently ran **15 Node and 21
  Solidity tests, all passing** with no skipped tests. The managed chain
  admits all four original signed Type groups; the reader verifies the full
  snapshot and independently checks all sixteen candidate cache rows again
  at the selected block before consuming them.
- Solidity and JavaScript agree on exact fields, reference roles/full IDs/leaves
  and numeric errors for ObjectGenesis, BindingSet, DirectoryEntry,
  FileRevision, ChunkTree and a hand-framed all-kind schema. The latter is
  explicitly parsed, **not admitted**. Thirty-nine valid/malformed bodies have
  independently recomputed ordinary domain/Type/body Record preimages, so
  malformed cases are not rejected merely for stale hashes.
- Both task reviews independently approve specification and quality with no
  findings. SDK/Web Client PM re-reviews closed the scoped acceptance edits;
  the stateful reviewer approved the next-increment specification and its
  explicit C0 evidence exclusions. Final joined review of `4d09403..8dbb7c1`
  approved feature-branch publication with no P0/P1/P2/P3 findings.
- All 32 local Markdown links in the five checkpoint documents resolve.
  Decision roll-up, design tri-sync and whitespace checks pass. Final
  prepublication checks run again after this closure note.

Local commands from the worktree root:

```sh
forge test --root Reviews/2026-09-05-c0-core --use "$EFS_C0_SOLC"
node --test Reviews/2026-09-05-c0-core/test/*.test.mjs
./scripts/open-decisions.sh --check
./scripts/tri-sync-check.sh
git diff --check
```

`EFS_C0_SOLC` selects the locally installed native Solidity 0.8.30 compiler.
The pinned build uses Cancun, optimizer 200 and via IR. The Node runner uses
the already managed local Anvil and synthetic payer; it has no external RPC or
real-user signing path.

| Test-only component | Deployed runtime | Deployment gas |
|---|---:|---:|
| BodyHarness | 7,451 bytes | 1,664,372 |
| LiteralSchemaHarness | 7,427 bytes | 1,659,366 |

The six representative valid body calls estimate **84,919–287,819 gas**,
including ABI cache transport. Those are `eth_estimateGas` results, not mined
application-admission costs or worst-case body bounds. Both deployment receipts
and runtime read-backs were checked under the normal 24,576-byte runtime and
16,777,216-gas transaction ceilings. Parser and body harnesses are separate
test-only deployments, not a chosen production topology or a full-Core fit.

## Design repairs and retrospective

1. **Separate what was checked.** SDK PM review confirmed four distinct
   assessments: Record identity, structural body, referenced targets, and exact
   application-profile acceptance. The SDK design now makes that distinction
   explicit without adding a sixth seam or a generic `Valid<T>` escape hatch.
   Successful earlier checks remain visible after later failure.
2. **Close the File presentation false positive.** Web Client PM found that
   the old acceptance wording could let byte verification stand in for File
   semantics. The existing nine rows now require the route-selected semantic
   claim before trusted File preview/download; Current additionally requires
   current-head evidence. Exact historical revisions stay usable, unavailable
   bytes do not erase an established File, and unsupported semantics remain
   inspectable raw evidence. Scoped PM re-review closed these edits.
3. **Make capability declarations honest before minting them.** The bootstrap
   audit found B0 ACTIVE account verifiers outside C0 scope and a pending gas
   constant. The next C0 serializer must explicitly encode its supported
   authority overlay, not copy a misleading B0 table. The same rule catches
   the pre-withdrawal proof's incompatible witness assumption.
4. **Improve integration order.** Build actual body/admission/Binding/index
   capabilities before claiming genesis activates them. Use one history owner
   and one checked-body representation. The next increment's twelve failure
   cases now specify what must hold before the Lens joins.
5. **Keep module mechanics below developer APIs.** A named Foundry remapping
   fixed compiler/linter resolution to the identical prior parser source;
   it changed no accepted bytes. Descriptor-cache details remain internal.
6. **Correct fixture assumptions before counting failures.** The independent
   reader worker initially framed ObjectGenesis's meaning as optional text;
   the actual candidate uses optional fixed 32-byte data. The worker corrected
   that fixture from the retained source, then reproduced the intended RED
   against a failing harness stub before enabling the real validator. A fixture
   mistake was not counted as a validator failure or a passing negative test.

These are reversible engineering refinements, not newly invented owner
rulings, permanent profile choices or release authority. The main improvement
is testing the seams between pieces and tightening acceptance language rather
than treating a growing count of component tests as an MVP verdict.

## Remaining work and owner followups

The [continuous track](README.md) and [next stateful specification](stateful-integration.md)
remain active. Structural decoding alone establishes neither target existence
nor Files semantics, authority, currentness, full Unicode/NFC conformance,
atomic application mutation, full-Core size fit, G0–G12 completion or any of
the nine joined C0 journeys. Component harness deployment is not full-Core
deployment evidence.

**No owner answer is needed now.** Continue internal implementation and
integration. Request actual-wallet participation when a reproducible wallet
flow is ready to exercise; do not call synthetic traces real-wallet UX.
Product repositories, public deployment, durable user data, main merge and
permanent protocol/release choices still require separate authority. Keep the
native MVP goal active through this checkpoint.
