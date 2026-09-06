# C0 → SDK → static Files handoff

**Status:** selected reversible integration sequence, 2026-09-06; not an
implemented adapter, adopted public API, authenticated run, or browser pass.

Source-backed read-only handoffs from the SDK and Web Client / OS PMs agree on
the boundary below. The [C0 profile](../../Designs/efsv2/disposable-mvp-profile.md),
[genesis](../../Designs/efsv2/mvp-c0-genesis-manifest.md),
[SDK five seams](../../Designs/sdkv2/mvp-interface.md), and
[joined acceptance](../../Designs/web-client-os/mvp0-acceptance.md) remain the
requirements. This sequence does not replace the nine acceptance journeys.

## One shared integration boundary

| Lane | Supplies | Does not supply |
|---|---|---|
| Core | Authenticated public ABI, initialized run, admission and authority evidence, bounded reads, atomic Files operations | Trusted test-context publication as a production route |
| SDK | Exact context/runtime verification, codecs, retained raw evidence, Files joins, wallet-free plans, authorization/submission adapters, independent canonical read-back | Config fetching, endpoint choice, wallet discovery/selection, prompts, UI success |
| Web | Static manifest loading and shape projection, explicit external read transport, routing/cancellation, lazy wallet selection, trusted preview and evidence presentation | A second decoder/resolver/planner, or an inference of canonical effect from transaction inclusion |

The immediate Core read dependency is Binding point/history, BindingScope and
RealmRevision/H, joined with existing exact reads. The write dependency is
actual initialization, authority branches, carrier integration and operation
preflight. Complete the [read overlay](read-overlay.md)'s 18 required
capabilities; optional convenience batching is not a prerequisite.

Produce one immutable **run-local** manifest and tracked public ABI from the
initialized/authenticated four-component deployment: Core, carrier,
AdmissionLibrary and PreparationHelper. Name chain, Realm/profile, Route,
Mount/config/Plans, addresses and runtime hashes, carrier limits, roots and
capabilities, genesis receipt and source/read basis. Independently recompute
the artifact after G0–G12 and the required first post-genesis file. Immutability
of this experiment's artifact is not a permanent protocol/manifest freeze.
Do not expose `publishTrustedForTest` or caller-supplied `VerifiedContext` as
the browser's write interface.

## Small adapter, preserved control

Keep the existing `efs-lab/1` Reader/facade and September 4 workflow files as
regression evidence. A C0 adapter is separately named and does not merely
replace addresses in the lab implementation. Illustrative experimental files
under [build-start](../2026-09-05-mvp-build-start/README.md), not adopted package
paths or public API names:

- `sdk/c0-reader.mjs` plus declarations: `createReader({source, context})`;
  injected read-only transport and immutable run context, no authority graph.
- `sdk/c0-actions.mjs` plus declarations: lazy
  `createActions({reader, authorizer, submitter})`, never imported by guest boot.
- `sdk/c0-codecs.mjs`: pure/generated exact codecs with accepted vectors;
  do not bundle the Node/assert-based verification oracle into the browser.
- `sdk/c0-adapter.test.mjs`: raw-result, qualification, planning and read-back
  tests against the actual target.
- `spa/config.mjs`, `bootstrap.mjs`, `export.mjs`, `test.mjs`: project inert
  public manifest, build Reader only, export separate guest/action graphs and
  exercise the joined journey. Extract `read-provider.mjs` for explicit RPC.
- New C0 `spa/files-app.mjs`, `files-view.mjs`, `model.mjs` consume
  `{reader, actions?}`. Preserve hash routes, Inspector and generation fences;
  Type/Binding/byte/planning joins belong behind SDK Files results.
- Lazy `spa/wallet-connector.mjs` and `files-actions.mjs` own explicit
  EIP-6963 selection, provider-generation checks and trusted preview lifecycle.

Remove lab globals, synthetic accounts/grants, the old two-contract ABI and
hard-coded lab roots/limits from the new graph. Retain relative assets,
arbitrary-prefix export, hash routing, inert `config.json`, explicit external
transport, CSP baseline and cancellation fences. Omit eager Data/Arcade
modules from this first C0 Files graph; neither omission retires those apps.

## Exact evidence rules

Pin one source block hash for each coherent read. Keep chain/source/read
target, block number/hash, state root, runtime hash and finality separate from
semantic Realm/RealmRevision/H. An observer block or an occurrence's ordinal
is not a substitute for H. Recompute identities from **returned** bytes.

Only verified initialized authoritative context and the imported absence law
can support ABSENT_PROVEN. Provider loss, unavailable pin or unknown revert
is UNKNOWN; inconsistent retained-state evidence is not absence. Missing
pages stay PARTIAL, even with an empty result. Wrong Type, invalid Files
profile, mixed H, unresolved higher-priority selection or corrupt bytes must
not produce an accepted Files DTO. Preserve successful earlier checks and raw
evidence without collapsing all assessment into an unqualified valid flag.

Planning is wallet-free. Preparation yields PREPARED, not accepted effect.
Submission/relay receipts yield observed progress, not COMMITTED. Only fresh
canonical read-back matching every predicted effect can establish the latter.
An all-reused admission keeps its original receipt; do not reinterpret it
using the latest accepting batch or today's grant state.

## Joined browser trace: STATIC-C0-FILES-1

1. Serve the independently recomputed run and static export under a non-root
   prefix. Same-origin `/config`, `/rpc`, `/wallet`, `/relay`, `/session` all
   return 404. `./config.json` is an inert asset, not an application service.
   Disable SW/Cache/IndexedDB/OPFS for this cold proof.
2. Open an explicit nested Files link in a fresh browser with a throwing
   `window.ethereum` getter and instrumented discovery events. Reader verifies
   context, fully pages the directory, resolves File/FileRevision/ChunkTree,
   and verifies complete bytes and a range at one pin. Count zero wallet
   imports, property reads, discovery events, account/relay/session calls.
3. Explicit Connect imports actions/wallet discovery. Pin selected provider,
   account and chain generation; invalidate the plan on drift. Fence every
   awaited preparation step and test Cancel, Close, Escape and navigation.
4. Relayed CREATE_SMALL_FILE (kind 8): one routine typed-data signature, no
   wallet transaction request. External relayer pays/submits. Verify seven
   admitted effects: ObjectGenesis, charter BindingSet, ChunkTree, initial
   FileRevision, DirectoryEntry, file-head BindingSet, name-slot BindingSet;
   verify complete parent listing and bytes before showing Saved.
5. Direct CREATE_DIRECTORY (kind 2): one wallet transaction request and no
   preceding typed-data signature. Verify its four effects: ObjectGenesis,
   charter BindingSet, DirectoryEntry, name-slot BindingSet. Preserve
   EXPERIMENTAL_DIRECT_CORE, DIRECT_EOA_TRANSACTION_AUTHORSHIP and
   `filesPreconditionCertified=false`. This is not G6's pre-Route root creation.
6. Establish a bounded same-Principal session in a separate wallet-visible
   setup/read-back step; generate and hold its signer locally, not in static
   config or a same-origin service. Session PUBLISH_FILE_REVISION (kind 9)
   makes zero routine wallet requests. Verify ChunkTree, FileRevision and
   file-head BindingSet, same File/Principal, CAS advance, new bytes and retained
   old revision. Stale CAS changes neither Core nor carrier and never silently
   replans/widens authority. Revoke and reject a fresh otherwise-valid write.
7. Destroy browser state; reopen directory, folder, head and both revisions
   as a guest with identical IDs/bytes and zero wallet discovery again.

The only mutation targets here are CREATE_DIRECTORY, CREATE_SMALL_FILE and
PUBLISH_FILE_REVISION. A tombstone operation is not a substitute. All nine
joined journeys and G0–G12 remain additional controlling acceptance coverage.

Record **three independent counters**: trusted Web previews, EIP-1193 method
requests, and wallet-owned confirmation surfaces. Controlled providers/local
signers prove CONTROLLED_EIP1193 accounting, not extension discovery or popup
UX. A headed run with a pinned real extension/build is separate REAL_WALLET
evidence; it may remain explicitly NOT_RUN while synthetic integration closes.
Do not infer the third counter from the second. Count setup and revocation
separately and retain full lifecycle totals as well as routine budgets.

## Retrospective and next trigger

What could have gone better: the static lab already proves useful delivery
properties but its backend is smaller than C0. Address-swapping or maintaining
parallel Web and SDK resolution would conceal that gap. Keeping the control
and specifying one truth adapter makes the missing contract work visible.

Next coordination trigger: an executable authenticated ABI/run artifact,
not another capability list. Build the missing contract reads and joined
host first, then implement the adapter and joined trace against it. No owner
decision is currently needed. Actual-wallet participation and product-repo,
public-deployment or permanent release authority stay explicit later followups.

Handoff provenance (read-only, no tests/edits by the PMs): Codex SDK task
`01a02a24-01b3-7f12-9f2e-887aea66e9e8`; Web Client / OS task
`01a0025a-16e3-7f31-8a98-304963732995`, 2026-09-06. Root checked the current
static bootstrap/config and imported SDK contract when integrating this note.
