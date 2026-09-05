# MVP build-start checkpoint

**Status:** reviewed and verified September 5 engineering checkpoint; feature-branch handoff.
**Source control:** branch `codex/mvp-c0-coherence`, starting at `1a51c5d`.
**Authority:** James requested overnight progress with an elegant SDK, static
SPA and well-designed contracts. This authorizes reversible engineering, not
production release, permanent protocol choices or a merge to main.

## What this adds

| Priority | Working artifact | What it establishes |
|---|---|---|
| SDK elegance | [reader and explicit actions proof](sdk/README.md) | small TypeScript consumer surface, reader-only capabilities, runtime checks, retained evidence and independently verified completion |
| Static SPA | [static export](spa/README.md) | Files/Data read real lab contracts from a prefixed static origin, with separate explicit RPC and no signing/app backend |
| Real Core inputs | [sixteen exact candidate descriptors](type-inputs/README.md) | machine-readable trees, ordered group/Record-body bytes and independently reconstructed temporary IDs; all four groups fit carriage bounds |
| Contract design | [execution-budget comparison](contracts/README.md) | working stipend/reservation and measured alternatives, atomic semantic/carrier rollback, real transaction costs and explicit fee limitations |

The SDK, static browser and budget probe remain separate proofs over or beside
`efs-lab/1`. The new C0 descriptors are not substituted into its smaller schema
grammar. There is still no complete C0 admission/identity/index/Binding/Lens/
genesis implementation, and none of the nine full-C0 M0 journeys is claimed.

## Product PM feedback applied

SDK and Web Client / OS PMs reviewed source `1a51c5d` read-only and did not edit
this worktree. The useful conclusions were incorporated without creating more
PM process documents:

- Keep a zero-wallet reader capability, opt-in actions and explicit transport
  injection. Do not present a caller-selected generic TypeScript `T` as schema
  validation. Production should use exact-profile query/action tokens and
  immutable, basis-bound continuations.
- The current reader entry avoids wallet calls, but its underlying lab import
  graph still includes write code. Production needs genuinely separate reader
  and action/wallet chunks; hiding methods is not bundle separation.
- Make every same-origin dynamic lab endpoint return 404 in the static proof.
  Only configured external JSON-RPC supplies data. Configuration is inert and
  cannot nominate executable module URLs. No server-held session keys ship.
- Keep the production startup small: Boot/router → Reader/Files → optional
  action/wallet, Data or Arcade chunks. No service worker is required for the
  first foreground read/write slice. A successful arbitrary-prefix test is not
  certification of an unsafe shared gateway origin.

## Findings that changed the build inputs

`ByteDigest/1` contains only `DIGEST`, not an invented size field. Some content
reference roles use source-prescribed `expectedType=ANY` with contextual
allowed sets; that is not a new unqualified parent role or permission. The
earlier [inventory](../2026-09-04-mvp-rehearsal/engineering-inputs.md) now points
to this correction.

The Type input artifact exposes the remaining local-profile choices rather
than burying them: semantic metadata/source closure, some declared indexes,
the G11 seal's field kinds/widths/roles, and Route enum numeric values for actual
instance bodies. These are narrow engineering choices. They can be selected
explicitly for the next disposable version and changed with new IDs; no new
owner product questionnaire is required to continue that work.

The budget comparison makes a cost/complexity choice visible. Reserving a full
signed child-frame allowance is simple to bound and replay from history but
wastes allowance when work is cheap. A work-region meter uses less allowance
but requires exact boundaries, accounting-tail validation and historical
evidence. Neither caps the whole transaction or a user's fee.

## Validation commands

Root reproduced 16 SDK runtime tests plus strict TypeScript/nine negative
contracts, nine static-browser/export tests, twelve Type-input tests and exact
artifact regeneration, nine budget-probe Solidity tests with 128 fuzz cases,
and three separate-transaction budget tests. Baseline regressions also pass:
24 Solidity, 95 Node, strict TypeScript, eight original and nineteen extended
joined Chromium journeys, plus nine isolated Files UI regressions.

Independent SDK and contract task reviews found no actionable defects. SPA
review caught a missing actual Arcade navigation in the browse test; the test
was corrected, rerun and re-reviewed. Type review caught duplicate nested
STRUCT sibling names; the checker now rejects them recursively with regressions,
while the sixteen retained candidate descriptors/IDs remain unchanged.
Both fixes passed scoped independent re-review. A separate whole-increment
review approved the combined source/profile and repository handoff boundaries;
no actionable findings remained. This approval is for the experiment checkpoint,
not production or protocol promotion.

Run from the planning worktree root with the existing rehearsal dependencies:

```sh
node --test Reviews/2026-09-05-mvp-build-start/sdk/facade.test.mjs
Reviews/2026-09-04-mvp-rehearsal/node_modules/.bin/tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext Reviews/2026-09-05-mvp-build-start/sdk/examples.mts Reviews/2026-09-05-mvp-build-start/sdk/negative.mts
node --test Reviews/2026-09-05-mvp-build-start/spa/test.mjs
node --test Reviews/2026-09-05-mvp-build-start/type-inputs/*.test.mjs
node Reviews/2026-09-05-mvp-build-start/type-inputs/materialize.mjs --check
forge test --root Reviews/2026-09-05-mvp-build-start/contracts --use "$EFS_LAB_SOLC" -vv
node --test Reviews/2026-09-05-mvp-build-start/contracts/measure.test.mjs
```

Set `EFS_LAB_SOLC` to the installed native solc 0.8.30 compiler and
`EFS_LAB_CHROMIUM` to installed Chromium when needed. The SPA default uses
existing compiled artifacts; `EFS_SPA_COMPILE=1` verifies/rebuilds first.
Existing baseline check/browser/extensions/Files-UI commands remain in the
[rehearsal](../2026-09-04-mvp-rehearsal/README.md). New test counts and baseline
regressions are different evidence sets, never interchangeable C0 scores.

## Next overnight continuation

1. This checkpoint's independent reviews and concrete fixes are complete.
   Verify its published commit before starting another engineering slice;
   do not redispatch these completed four lanes.
2. Next highest leverage: actual intrinsic TypeSchemaGroup ordinary admission
   and atomic derived caches, using these source-pinned descriptor bytes.
   First bind the required meta-Type/Codex/capability inputs in a named temporary
   run codec. Follow [G4](../../Designs/efsv2/mvp-c0-genesis-manifest.md):
   `publishWithPlanC0`, exact composite `ADMIT_TYPE_GROUP` WritePlans, zero
   pre-Route `routeConfigId`, a separate schema-author Principal and retained
   `C0_COMPOSITE_EOA_V1` witness. Do not mislabel it as a chain-free Stage A
   envelope signature. No second schema registry or standalone admission bypass.
3. Keep author-neutral Record identity, attributed Envelope/Occurrence admission
   and mandatory enumeration/index state together from the first implementation.
   Test an anticipated-but-unadmitted Type, duplicate Record/new Occurrence,
   exact same Occurrence replay, malformed/substituted group, partial-cache
   rollback and cold retained-state reconstruction. Measure code and transaction
   sizes with ordinary limits enabled.
4. SDK and static app move onto that implementation only when its actual
   serialized deployment, profiles and read-back artifacts exist. The old lab
   remains a regression control. Real wallet extensions, lazy production bundle,
   richer game features and large files do not block this first admission slice.

Do not rerun completed design discovery, resurrect old assignments, or create
work merely to fill the night. Stop starting new work at 09:00 Chicago on
September 5; the current-task continuation is bounded to that morning. No new
repository, deployment, main merge or permanent ID minting is authorized here.
