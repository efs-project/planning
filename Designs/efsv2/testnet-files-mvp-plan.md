# A testnet Files MVP we can actually use

**Status:** draft — recommended build sequence, not protocol freeze
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[system-constitution]], [[core-architecture-candidate]], [[hierarchical-files-and-folders]], [[../sdkv2/mvp-interface]], [[../web-client-os/mvp0-acceptance]]
**Supersedes:** — preserves the disposable C0 experiment as evidence
**Reviewers:** Codex `mvp_browser_acceptance` and `testnet_upgrade_boundary` — bounded source/plan review corrections closed, 2026-09-08
**Last touched:** 2026-09-08

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/human-overview #topic/content

## Problem

The project owner should not need to understand the entire design corpus to
judge EFS. A useful MVP must demonstrate ordinary file operations and the
unusual EFS features together, including a real upgrade of populated testnet
contracts. The September 8 [[owner-rulings|requirement]] makes testnet
upgradeability mandatory; it does not select diamonds or permanent governance.

**Where we actually stand:** the `efs-lab/1` browser has exercised small-file
creation, upload, revisions, history, download and typed tables. It is not the
actual C0 Binding/Lens filesystem. Rename, move, remove/restore, authored tags
and upgrade continuity have not been demonstrated end to end. All nine
full-C0 browser journeys remain `NOT_RUN` in the inspected acceptance ledger.
Component tests are useful, but they do not close this gap.

The [September 8 real-state foundation experiment](../../Reviews/2026-09-08-upgradeable-foundation/README.md)
now carries the bounded upgrade work. Its
[consumer checkpoint](../../Reviews/2026-09-08-upgradeable-foundation/consumer-checkpoint.md)
turns the next Lens, rename and authored-tag joins into explicit expected
outcomes; its boundary tests must not be mistaken for a working Files browser.

## Proposal

### The product in five sentences

A **file** has a stable identity and a history of immutable content revisions.
A **directory entry** gives it a name and location; moving it does not change
which file it is. A **Lens** says whose claims to use when people disagree
about names, versions or tags; it does not give anyone permission to write.
A **tag** is an attributed relationship to a file or other supported object,
not a special permission. The browser shows the result and can explain who
said it, which Lens selected it and whether the available evidence is complete.

### Testnet contracts: replace the engine, keep the address

Recommend standard **OpenZeppelin Transparent proxies with ProxyAdmin** for
the stateful Core and byte carrier, namespaced storage, and a project-owner
controlled testnet upgrade account. Keep fixed, release-pinned libraries and
stateless helpers replaceable through a new implementation release, not an
open-ended plugin dispatcher. UUPS is a reasonable alternative; diamonds are
a fallback if measured size or independent-module update needs justify them.
The [[../../Reviews/2026-09-08-testnet-upgrades|research and safety plan]] explains
this recommendation and its tradeoffs.

The stable address is not the whole identity of executing code. Each upgrade
must record a new execution revision, preserve old record/receipt interpretation,
and invalidate stale write plans. A revision covers the whole coupled set:
Core, carrier, any stateful FilesRouter, fixed helpers/libraries and controller
references. U1 guards check the contract-observable configuration; the SDK
also verifies deployment/runtime evidence, including the actual proxy admins.
Neither relies on the unchanged proxy shell alone. Missing activation or a partial endpoint upgrade must
block ordinary writes. A failed coupled upgrade must leave the previous configuration
intact. The disposable foundation now exercises these guards and rollback with
real EFS state in 14 contract tests. This is not yet evidence for the full
C0-authorized FilesRouter, SDK or browser path; those joins remain below.

The prototype history must retain the Core admission high-water at activation
as well as the block. U1 writes can precede a U2 activation in the same block;
block-only history would make independent historical interpretation ambiguous.
The exact source-pinned experiment ABI remains disposable.

The managed September 8 experiment also publishes real FILE/DIRECTORY meanings,
publisher charters and one seven-leaf small-file metadata operation using the
same EFS Store. It preserves that inventory and exact bytes through U2 and
independently reconstructs the exported snapshots offline. The operation costs
about **14.15 million gas** under the **16,777,216** experiment cap, with byte
staging separate; the linked admission library has only **330 runtime bytes**
remaining. These are measured design constraints, not full Files certification.
Keep Files/router behavior outside that nearly full admission component and
measure complete routed creation and atomic rename before treating their fit
as established. Do not make an atomic operation appear to pass by splitting it.

The SDK consumes complete execution context, not an app-supplied revision
number alone. Preserve original acceptance history separately from today's
reader/basis; unavailable history remains unknown even when exact bytes can be
checked. Decode emitted errors from fixed linked dependencies as well as the
Core ABI. The prototype's synthetic operator and separate staging signatures
do not settle portable authority or the one-approval wallet acceptance row.

The UI must say **Upgradeable testnet**, show who can upgrade it, and make no
immutable-hyperstructure claim. An upgrade controller can install bad code;
these safeguards detect mistakes and provide accountability, not immunity to
a malicious controller. Permanent deployment and its immutability decision
remain separate. Incompatible data changes require an explicit migration or
new Realm, not silent reinterpretation or a promised universal rollback.

### The acceptance contract

Every row below needs an automated joined test plus an inspectable browser
result. Passing the smaller lab does not count as passing a row against the
new testnet profile. Each report records source revisions, deployment/revision,
wallet used, limits and `PASS`, `FAIL` or `NOT_RUN`.

| Journey | What the owner should see | What the test must catch |
|---|---|---|
| Guest browse | Open a shared nested folder, breadcrumbs and a verified file without a wallet. | Static SPA works with Commons, OS boot, EFS-operated services and hosted indexes unavailable, and lab `/config`, `/rpc`, `/wallet`, `/relay`, `/session` returning 404. Only explicitly configured transports to the test Realm/content remain. |
| Directory listings | Names, kinds, useful metadata, loading progress and honest completeness. | Pinned pages cannot skip live entries after many dead names; a partial page is not an empty directory. |
| Create and upload | Create a folder, text file and image; reload and see the same IDs and bytes. | Duplicate name, invalid name, denied authority or failed admission leaves no half-published file. |
| Edit and history | Edit a note, inspect both revisions, open the old revision directly. | A stale edit loses its compare-and-swap race without overwriting the winner. |
| Rename and move | Rename a file, move it, then move its containing folder. | File and descendant identities stay unchanged; destination/source checks and effects are atomic within one Realm. |
| Copy and second placement | Copy creates a new file; an explicitly linked placement points to the existing file. | Identical bytes do not collapse two distinct files; editing a copy does not edit the original. |
| Remove and restore | Remove a placement, see it in Removed items, restore it or an earlier content revision. | No claim of byte erasure; lower-priority names do not unexpectedly reappear; a restore collision needs a choice. |
| Lens switching | Compare My view, A-first and B-first; use “Why this result?” on a disagreement. | No hidden default change, silent merge, authority grant or fallback through an unknown/conflicting higher tier. |
| Tags | Tag the same note/image/video with `ocean`; inspect each author's assertion. | File identity is unchanged; removing my assertion does not delete another person's assertion. |
| Filters and tables | Filter the current folder by name, exact Type, author and trusted tags; view supported records as rows. | Zero loaded matches is not proof of zero total matches. Negative filters require complete input; table sorting is not a global-order claim over missing pages. |
| Bytes and failures | Download verified empty, small and multi-chunk files; recover through another configured provider. | Corrupt bytes never reach preview; unavailable bytes are not an absent file. Size-limit rejection happens before authorization. |
| Wallet and cancellation | One routine EOA approval on the chosen path; zero routine session prompts after a scoped grant. | Count actual wallet prompts, including setup separately. No automatic signature-plus-transaction fallback; Cancel/Close/Escape before submission has no semantic effect. |
| Permissions and races | Read as a guest, write as an authorized author, reject an unauthorized signer; race two tabs. | The contract enforces authority and routed operation preconditions, not just the UI. Revoked/expired sessions cannot write. |
| Export and recovery | Export a selected subtree and reopen its plain files plus verified EFS history in a clean reader. | Required bytes, Types, identities, Lens/basis and receipt evidence are accounted for; missing closure is explicitly partial. No dependence on the old browser cache or index. |
| Upgrade populated state | Upgrade U1 to U2 and repeat the same walkthrough at the same endpoints. | Old citations survive; old prepared signatures fail; new writes succeed; implementation/history mismatch and failed migrations cannot report success. |
| Independent use | A Solidity consumer resolves competing names/versions through the same bounded contract Lens Plan; an independent reader checks retained bytes. | Compare `FOUND`, `ABSENT_PROVEN`, `CONFLICT` and `UNKNOWN` fixtures with the browser. A client-only Lens reducer or transaction receipt alone cannot satisfy this test. |

Use two authors with competing names/tags, an editable note, an image, an
unknown-Type record, nested directories and a churn-heavy listing. Include
malformed data, missing evidence and hostile preview content. Rich previews
must not execute untrusted file content in the application's trusted origin.
Submit malformed known-Type data and wrong-target references too: contract
admission must reject violations of the declared supported validation profile;
unknown or unevaluated rules must not be presented as having passed.

### Concrete defaults to build, not more owner questionnaires

- **Files:** same-Realm atomic mutations first. Core remains generic; a
  FilesRouter or equivalent execution-bound contract path enforces resolved
  source/destination preconditions. A UI-only “destination is free” check is
  insufficient. Cross-Realm transfer is an explicitly separate copy/publish
  workflow, not an atomic move claim.
- **Remove:** mask the selected placement in an authorized overlay; retain
  history. The advanced “withdraw my claim” operation is different and permits
  Lens fallthrough. If the actor cannot mask the selected result under this
  Lens, explain that rather than claim it disappeared for everyone. Removed
  items use enumerable ordinary removal Records identifying the former parent,
  name, Object and removal operation, with current per-author Bindings.
  Remove atomically creates that marker and the placement mask; rename/move
  does not create a removal marker. Restore rebinds the same Object at a
  collision-checked destination and retires that exact author's marker in the
  same operation. Claim withdrawal is not Trash. Version restore selects old
  content in a new recorded action without rewriting history. These are
  proposed application Records/roles, not new Core kinds.
- **Names:** propose case-sensitive NFC-normalized UTF-8 for this testnet
  profile, reject empty names, `/`, NUL, `.` and `..`, and publish its byte
  limit. Show normalization/collision errors. Test composed/decomposed names,
  case-only rename, length boundaries and moving a directory into itself.
  This replaces the narrow lab's ASCII restriction, not an adopted permanent
  filename format.
- **Tags and filters:** ordinary exact application Types and authored
  assertions targeting stable Objects; explicit trusted-author selection and
  exact tag IDs. For each author/tag/target tuple, a current Binding selects
  that author's assertion; untag tombstones only that Binding, while re-tag is
  a fresh assertion/bind. Positive tag AND/OR filters over the selected folder
  first. Candidate assertions, current heads and their Type/backlink/scope
  query coverage share one pinned basis: a historical assertion alone is not
  a currently active tag. No required hosted private index or unqualified
  global-search promise. Progress and coverage stay visible.
- **Bytes and SDK:** bounded staging before atomic file publication. Publish
  measured upload caps; do not turn the lab's expensive full-payload receipt
  storage into the production design. One shared Reader/Actions SDK owns
  verification, planning and read-back; the browser and Explorer do not
  implement second resolvers. Export uses a clearly versioned testnet transport
  manifest plus exact files/evidence, not a newly frozen canonical bundle ABI.

### Build sequence and ownership

Use the existing [[../../Reviews/2026-09-04-mvp-rehearsal/repository-blueprint|three-repository blueprint]]:
Contracts, TypeScript/Solidity SDK, and static Web Client. Data Explorer is a
separately owned view component that can initially live in the Web workspace.
These are intended responsibilities, not new repositories created by this plan.

| Checkpoint | Concrete deliverable | Lead and review |
|---|---|---|
| 1. Upgradeable foundation | Authorized initialization, namespaced state, revision-bound writes/reads and retained-state U1→U2 test under normal EVM limits. Port only reviewed reusable C0 pieces. | Contracts Dev; v2 PM and SDK review |
| 2. First real browser loop | Static guest list → create → verified read-back → reload, using actual Core/Bindings and opaque SDK continuations. | Contracts + SDK + Web Client Dev; Data Explorer PM acceptance |
| 3. Complete file lifecycle | Edit/history, rename/move, copy/link, remove/restore; race-safe contract preconditions and documented names/limits. | Same vertical team; v2 PM integration |
| 4. EFS-specific value | Lens disagreement/explanation, tags, scoped filters and exact-schema table; independent Solidity consumer. | SDK + Data Explorer + Web Client; Booru/Media PM advice |
| 5. Release rehearsal | Repeat all rows before/after an upgrade; real-wallet checks, hostile providers, fresh-reader export recovery and a short owner walkthrough. | v2 PM coordinates; independent reviewers verify |

The next coding slice should enter the real repositories once their creation
and this build direction are approved. Do not rebuild this entire product as
another throwaway implementation first. Before that, only run a bounded
upgrade/storage or contract-size experiment if it can change the foundation
choice. Arcade is a useful sixth checkpoint, not a condition for a working
Files MVP. Full OS, drive mounts, plugin marketplace, global search, private
sync and huge-file performance are not quietly included in this first release.

### The owner's 15-minute acceptance walkthrough

Open as guest. Create `trip/`, a note and image. Edit the note and open its old
version. Rename it and move the folder; inspect the unchanged IDs. Tag both
files `ocean` and filter them. Switch between two disagreeing Lenses and inspect
why the answer changed. Remove and restore a placement. Export it and reopen
in a clean reader. Upgrade the populated test Realm, reload, read old links,
and make a new edit. An interrupted upload and a rejected stale edit should
be understandable without reading Solidity or the type specification.

The lowercase name is deliberate for the first contract-checkable
`FILES_ROUTER_ASCII_NAME_V1` arm. Also try `Trip/` and an NFC Unicode name:
both can be valid rich Files names while unsupported by that selected router.
The UI must say unsupported, not invalid, and never silently lowercase or
rewrite the intent. Full rich-name certification is a separate measured gate;
the ASCII experiment is not the final modern-file-browser naming promise.

**Done means this works, the automated counterparts agree, and limitations
are explicit.** Not “every future design question is answered,” and not
“ready to freeze contracts for a century.” Each failed row gets one owner,
one reproducible fixture and one next action. Design details stay linked below
the workflow rather than becoming another mandatory reading stack.

## Open questions

- [ ] Contracts/SDK reviewers close the bounded foundation gate: upgrade and
  execution-revision activation, storage compatibility, full module size and
  one-approval routed consent. These are engineering tasks, not an owner poll.
- [ ] Data Explorer/Web reviewers turn the proposed remove/restore, Lens and
  tag defaults into the same executable acceptance fixtures, including exact
  testnet query/limit declarations. No second independent UI semantics.
- [ ] Before creating product repositories, obtain the owner's go-ahead for
  this build direction and the three-repository start. This plan itself
  creates no product repo or deployed contract.
- [ ] Before public testnet deployment, confirm the actual upgrade-controller
  address/ownership, deployment network/profile and funding. Do not request
  permanent venue/governance decisions to run a reversible testnet MVP.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

Research and two independent source audits informed the original proposal;
that docs-only pass ran no new upgrade or browser implementation. The
subsequently authorized [real-state foundation](../../Reviews/2026-09-08-upgradeable-foundation/README.md)
has its own implementation and verification ledger. Its results do not
retroactively promote the old experiment or mark the browser journeys passed.
Each experiment remains qualified by its own profile and source revision.
Review corrections made guest/no-Commons and contract Lens checks explicit,
defined proposed removal/tag currentness, and separated contract-observable
upgrade guards from independently reconstructed proxy-admin evidence. Both
reviewers confirmed their identified blockers were addressed.
