# EFS v2 contract-readiness baseline — 2026-08-22

**Status:** point-in-time integrated evidence review; current-greenfield Stage B remains incomplete
**Audience:** project owner, EFS v2 Core/SDK/Data Explorer PMs, disposable experiment team
**Authority:** evidence only; this review adopts no protocol bytes, IDs, limits, topology, or deployment
**Planning head reviewed:** `10ddb430a167bdf33ff51176b8cf640e87d2423c`

#status/done #kind/review #repo/planning #repo/contracts #repo/sdk #topic/efsv2 #topic/readiness

## Executive result

EFS has more executable evidence than the current Stage A status page implies,
but less integrated evidence than a durable-contract start requires.

- **Stage A:** broad specification and fixture preparation is complete.
- **Narrow disposable Stage B:** real and useful. Portable IDs, a one-leaf EOA
  admission micro-spine, an isolated Binding fold, bounded postings, selected
  reconstruction, an application-shaped Git P6 write, and several Type/Data
  pressure fixtures exist across local branches.
- **Integrated current-greenfield Stage B:** unrun. There is no one executable
  candidate containing the current Type model, generic multi-leaf admission,
  uniform Principal/Realm authority, Binding effects/scopes/Withdrawal,
  QueryProfile completeness, a minimum Lens, and full reconstruction.
- **Freeze:** not ready. No current candidate has permanent bytes, complete
  cross-language implementations, final bounds, selected EVM topology, or an
  owner-ratified freeze packet.

The correct next move is evidence consolidation followed by a sealed transition
spec/corpus, an independent pure state model, and a disposable monolithic
Solidity SUT. It is not a fresh experiment repository, a production proxy
scaffold, or another broad synthetic workload forecast.

## Method and freshness

This review combined:

1. the active planning authority and greenfield candidate documents;
2. commit/status/tree inspection across all 11 local worktrees of
   `experiments/efs2-b0-stage-b`;
3. independent read-only audits of the non-Type Core evidence, Type evidence,
   and branch topology;
4. targeted fresh replay of the two most relevant existing fixtures.

Fresh replay on 2026-08-22:

```text
Git P6 TypeScript fixture:       16 pass, 0 fail, 106 assertions
Git/Forge Type/Data-ABI fixture: 37 pass, 0 fail, 133 assertions
```

Commands:

```sh
env -u GIT_PAGER bun test \
  test/ts/git-p6-codec.test.ts \
  test/ts/git-p6-corpus.test.ts \
  test/ts/git-p6-metrics.test.ts \
  test/ts/git-p6-postings.test.ts \
  test/ts/git-p6-wire.test.ts

env -u GIT_PAGER bun test \
  test/ts/git-checkpoint-type-data-abi-v0.test.ts
```

These passes validate their named fixtures at their current local worktree
states. They do not upgrade those fixtures to Core conformance or freeze
evidence.

## Repository and branch facts

The standalone experiment repository is local-only and has no configured
remote. Its common branch base is `108162af9c5184be0b49c253f637928647b61f25`.
The best practical foundation for a new integration worktree is
`48361e21fe336800fe861cb3402b2370be1b9b7f` (`spine-wip`), because it already
contains the cross-language vectors, admission/Binding micro-spine, corrected
state reconstruction, Envelope/Flatcard bakeoff, and code-size probe.

Four result families remain on divergent tips and must be imported as prior
evidence, not blindly merged as one implementation:

1. Git P6, partial checkpoint/recovery, and Git Type/Data ABI;
2. the Codex layered Type pressure pass;
3. the Fable Type simulator and consumer toy;
4. the Fable clean-room/cap/media pass.

The `git-checkpoint-v0-wip` worktree contains an uncommitted large interop-test
expansion. The Fable overnight worktree contains untracked Python cache files.
Both are preserved as somebody else's working state; neither should be used as
the writable integration checkout.

## What is genuinely established

### Exact identity and canonical fixture discipline

- Selected B0 Principal, Type, Record, Envelope, Occurrence, Position, Binding,
  ExpectedRevision, and Realm-intent formulas agree across the retained
  TypeScript, Rust, and limited Solidity fixtures.
- Exact nominal Type and Record identity is a viable deterministic,
  author-neutral primitive.
- Intrinsic accepted-value constraints and closed reference roles must remain
  identity-bearing in the leading flat-Type arm.
- Query/index policy can be split into an explicit QueryProfile without
  renaming historical Records.

This proves one experimental formula/corpus, not the current protocol formula.

### Type evolution and honest query evidence

- `SELF` means the exact declaring Type revision, not family, latest, or
  lineage.
- Historical exact Records do not mutate when a successor Type appears.
- Stable Objects, finite exact-Type sets, or pinned Views can express lineage
  without rewriting history.
- Existence-only references can support reachability/backlinks/archive
  evidence but do not prove semantic Type, authority, currentness, or bytes.
- Query evidence needs an exact profile/generation, basis, cursor/terminality,
  coverage, and completion state. Empty `PARTIAL` is not absence.
- View-wide `COMPLETE` requires a pinned finite Type inventory high-water. New
  permissionless Types outside that inventory cannot silently enter the result.

### Integrated-shape feasibility, narrowly

- An ordered shared Envelope is cheaper than per-Record Flatcards in the
  reduced 1–64-leaf fixture; the Flatcard arm exceeded the transaction cap
  earlier.
- The Git P6 harness expresses one unsplit 21-leaf write with exact ref order,
  CAS-shaped effects, replay/expiry cases, and atomic rollback checks.
- A small fresh reader can reconstruct the implemented one-leaf micro-spine
  from declared state reads without writer helpers.
- Packed postings materially reduce append cost in the synthetic posting
  fixture; hydration costs temper the apparent read advantage of wider rows.

These results do not jointly prove the current Core state machine.

### Application model pressure

Files, Git/Forge, Nanda, achievements, package catalogs, and media have not
shown a need for application-private Core nouns. Their semantics fit ordinary
exact application Types, stable Objects, authored Occurrences, attributed
evidence, finite closures, Bindings, and explicit policy/query seams.

This is a strong universality signal. It is not proof that the shared seams are
safe, complete, reconstructible, or affordable.

## Current gate ledger

| Gate | Grade | Evidence carried forward | Missing before real contracts |
|---|---|---|---|
| Type/Record identity | `PARTIAL` | exact nominal identity; independent selected vectors; clean-room corpus | corrected semantically equivalent comparator; full cross-language current bytes; EVM validation/costs |
| Principal | `PARTIAL` | EOA Principal and intent fixtures | uniform Principal comparison; ERC-1271; upgrade/historical basis; delegation/recovery seams |
| Realm/admission | `PARTIAL` | synthetic Realm; one-leaf EOA admission; replay/nonce | descriptor/genesis/revision semantics; generic multi-leaf; finality/time; cross-Realm recognition |
| Record/Occurrence/Envelope | `PARTIAL` | separations, Envelope bakeoff, Git P6 | current generic multi-leaf validation, shared-context comparison, subset/carriage attacks |
| Binding/Withdrawal | `PARTIAL` | isolated CAS/history/tombstone machine; Git fixture effects | integrated effects, Withdrawal/no-resurrection, complete scopes, basis pages |
| Query/completeness | `PARTIAL` | model fixtures preserve `PARTIAL`/`COMPLETE` and finite inventory | onchain QueryProfile activation/backfill/pages; full state reconstruction |
| Contract Lens | `UNRUN` | prose/profile and application pressure only | executable 1/8/32/50/64-principal point matrix; risk-bearer selection; conflicts/unknowns |
| EVM topology | `UNRUN` for current Core | old micro-spine size/gas warning | identical integrated semantics measured as monolith then justified alternatives |
| Reconstruction | `PARTIAL` | narrow one-leaf state reconstruction; portable Git closure | full Types/Records/Occurrences/receipts/indexes/Bindings/scopes/Lens inputs |
| SDK/DX | `UNRUN` as executable pressure | authoring sketches and design work | two clean generated SDK flows; raw runtime; Solidity helper; guest Explorer traces |
| Freeze | `NO-GO` | broad requirements and several useful fixtures | current IDs/bytes/limits, integrated run, independent reviews, owner ceremony |

## Corrected Type verdict

The working integrated-experiment hypothesis to falsify is:

```text
flat exact nominal Type
  + every intrinsic accepted-value constraint
  + closed statically extractable reference roles
  + separate QueryProfile
```

Keep the bundled identity arm as a control. Compute layered SemanticSpec,
Shape, and Representation identities as ablation/compiler outputs. Compare
committed and detached ViewBindings adversarially. Do not assume either belongs
in Core.

The Fable “detached bindings lose zero safety” result is invalid as selection
evidence. Its malformed-binding publisher returns `None`; the consumer then
falls back to a scan and selects a valid mapping. The comparison also discards
projected-value differences and excludes detached-only attacks. Corrected
tests must pin the exact binding identity, consume the actual caller-supplied
mapping, compare projection bytes and effects, and attack issuer/authority
substitution.

The Fable 951-event rankings and developer concept counts are synthetic model
outputs, not workload, EVM, or SDK measurements. Preserve their scenarios;
discard their architecture-winner claim.

## Highest-leverage integrated delta

Before the integrated artifacts, run controlled comparisons for uniform
`PrincipalId` versus tagged authors, self-contained Records versus shared
Context, portable publication versus Realm-bound publication, and a
self-authenticating RealmDescriptor/bootstrap. The existing Envelope/Flatcard
run is too reduced and confounded to select the carrier.

Build three distinct experiment artifacts: a sealed transition spec/corpus, an
independent pure state-model oracle, and a monolithic Solidity SUT containing:

1. generic exact-Type validation and bounded reference extraction;
2. generic multi-leaf Envelope/Occurrence admission;
3. explicit ExpectedRevision and target-existence evidence;
4. atomic Binding effects, history, tombstones, Withdrawal, and no resurrection;
5. `BindingScope` complete enumeration or a measured superior alternative;
6. exact-Type and finite-inventory queries with QueryProfile generation,
   backfill, basis, pages, coverage, and terminal completeness;
7. a minimal finite contract Lens;
8. state-readable bytes and public enumeration sufficient for full
   reconstruction.

The split-QueryProfile hypothesis still owes active/pending generation, dual-
write, interrupted backfill, cursor invalidation, hostile late-Type/spam, dead-
posting dilution, large-scale reconstruction, and exact terminal-coverage
authority tests. The Lens still owes the owner-required 1/8/32/64-Principal
matrix; the Files 50-Principal workload is separate evidence.

Then run the existing Git P6 trace unchanged through that generic model/SUT,
without constructor-preloaded application Types or targets. Next run Files
directory churn and executor/operation-bound consent. Only after those semantics
hold should the same projection be measured as a monolith, immutable facets,
or narrow modules.

## Documentation corrections

- “Stage B unrun” is accurate only for the pinned Stage A source snapshot.
  Current project wording should say: **narrow disposable B0 runs exist; no
  current-greenfield integrated Stage B or freeze evidence exists**.
- “Stage B has implemented Files” is too broad. No clean-browser guest Files
  vertical or integrated `BindingScope`/routed-consent run exists.
- The Git Type/Data-ABI commit does not close all Type ABI questions; its own
  fixture retains one honest Realm-wide Binding-name non-omission failure.
- Reports that retain successful command counts without raw result artifacts
  remain report claims, not fresh verification.

## Relationship to the week program

This baseline completes the read-only inventory portion of Lane 1 in
[[v2-contract-readiness-program]]. The next Lane 1 artifacts should be the exact
transition corpus/result registry, independent-model plan, and Solidity-SUT
plan on a clean worktree from `spine-wip`. No existing dirty worktree should be
modified, and no historical experimental identity should be promoted into the
new candidate by default.
