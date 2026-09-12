# Files/Data Explorer comparison journey

**Date:** 2026-09-12

**Author:** EFS Data Explorer PM

**Standing:** independent product pressure fixture for [[README|the path-decision sprint]]; executable in principle, not run evidence, an adopted ABI, or a protocol-byte proposal

**Inputs:** [[overhead-and-selection]], [[../../Designs/efsv2/hierarchical-files-and-folders]], [[../../Designs/efsv2/owner-rulings#Tags — rulings on the tag deep dive|tag rulings]], and [[../../Designs/data-explorer/experiments-and-stop-conditions#E1b — integrated cold-browser direct-guest gate|Data Explorer E1b]]

## Recommendation in one minute

Use one stable text File, two competing authored revisions, two Lens orders, one
File-level tag, one revision-level tag, and two folders. Move the File, reuse its
old path for a different File, remove it, then restore old content as a new
revision of the original File. Open and list the same graph at one fixed basis
from an unrelated Solidity consumer and a cold static browser with no EFS
server or optional indexer.

Run the discriminating core first:

1. create one File and fork its head between Alice and Bob;
2. prove Alice-first and Bob-first select different revisions without changing
   the File identity;
3. move the File and put a new File at its old path;
4. prove File tags follow the File, revision tags follow only their revision,
   and neither leaks to the replacement File.

A candidate that cannot pass those four steps has already falsified the cheaper
model; do not build the later failure cases merely to accumulate coverage. A
candidate may pack or reconstruct the meaning however it likes. Current record
counts, the seven-record recipe, index layout, cursor bytes and API names are
not requirements.

## Candidate-neutral fixture

Freeze these semantic inputs before integrating any road. Exact encodings and
IDs are candidate outputs, not shared constants.

| Input | Frozen meaning |
|---|---|
| Realm | One fresh disposable qualifying EVM Realm with an explicit code/configuration revision |
| Authors | Alice through an EOA and Bob through a genuine small producer contract, with independently checkable authorship; no invented Bob EOA signature |
| Folders | `/drafts/` and `/published/` |
| Namespace | Alice supplies the primary placements; after the move Bob adds a lower-priority placement of the same `F` at `/published/brief.txt` so whiteout behavior is observable |
| Stable File | `F`, initially placed at `/drafts/note.txt` |
| Base revision | `R0`: UTF-8 bytes `Meeting at 10:00.\n` |
| Alice revision | `RA`, parent `R0`: `Meeting at 11:00.\n` |
| Bob revision | `RB`, parent `R0`: `Meeting at 09:00.\n` |
| Restored revision | `RR`: a new revision of `F`, parent `RA`, whose bytes equal `R0`; it is not `R0` reused |
| Replacement File | `G`, created later at `/drafts/note.txt`, with different bytes and identity |
| File tag | Alice asserts commons concept `project_efs` about stable File `F` |
| Revision tags | Alice asserts `draft` about `R0` and `approved` about `RA`; the fixture's tag policy accepts Alice's exact stances |
| Views | `L-A`: Alice before Bob; `L-B`: Bob before Alice; comparison-only agreement policy `L-EQ` refuses to choose on disagreement (exact Lens grammar remains open) |
| Pagination probe | underlying page size `1`, solely to force continuation and empty-intermediate-page behavior; not a proposed limit |

Each read pins one explicit block hash/basis, Realm revision, selection policy,
required-query coverage and byte commitment. If a moving chain tag is offered,
resolve it once and retain the resulting block hash; never resolve it per page.

Freeze logical action boundaries as well as semantic data: setup; create `F`;
File-tag assertion; `R0` revision-tag assertion; Alice edit; Bob edit; `RA`
revision-tag assertion; rename; move; Bob placement; create `G`; remove; and
restore are separately priced actions. Restore is one user-level action that
creates `RR` and re-places `F`; report every transaction/receipt it needs.
Optional batching may be measured in addition, never substituted for these
totals. Authorization, submission, admission/indexing, byte staging and
canonical read-back remain separately observable phases.

## The journey and minimum observable outcomes

### J1 — Create and identify

Alice creates `F` at `/drafts/note.txt` with current revision `R0`, then applies
the File tag `project_efs` to `F` and the revision tag `draft` to `R0`.

Minimum observations:

- path open, direct-File open and folder listing agree on `F`, `R0`, the exact
  byte commitment, author/selection evidence and one basis;
- the File identity, revision identity, placement and bytes commitment are four
  distinguishable facts;
- create is one understandable logical action even if a candidate needs several
  internal facts or receipts; its two later tag actions remain separately priced;
- required index failure rolls the whole logical write back. No candidate may
  expose a point-readable File that its required listing silently omits.

### J2 — Edit into honest disagreement

Alice publishes `RA` and Bob's real producer contract publishes `RB`, both
derived from `R0`. Alice tags `RA` as `approved`. Read the same path at the
same basis through all views.

Minimum observations:

- `L-A` opens `F @ RA`; `L-B` opens `F @ RB`; both retain the same stable File
  identity and both losing candidates remain inspectable;
- `L-EQ` returns a visible conflict rather than a byte-order or latest-write
  winner;
- Bob's contract authorship is shown and checked as contract authorship, not
  laundered through a fabricated EOA witness;
- a File-tag filter for `project_efs` includes `F` under both `L-A` and `L-B`;
- a selected-revision filter for `approved` includes `F` under `L-A` and excludes
  it under `L-B`; filtering happens after the same selection used by open;
- history exposes `R0`, `RA` and `RB` with their parentage and authorship. A
  single global mutable head or destructive overwrite fails here.

### J3 — Rename, move and reuse the old path

Rename `/drafts/note.txt` to `/drafts/brief.txt`, then move it to
`/published/brief.txt`. Bob then places the same `F` at that published name as a
lower-priority namespace candidate. Create the unrelated File `G` at the
now-free `/drafts/note.txt`.

Minimum observations:

- all names for `F` resolve to the same File identity when historically
  inspected; rename and move do not mint a replacement File or rewrite `RA/RB`;
- current complete listings contain `G` in `/drafts/` and one selected `F` in
  `/published/`, with no ghost at `/drafts/brief.txt` and no duplicate `F`;
- the File tag `project_efs` follows `F` to `/published/brief.txt` and does not
  transfer to `G` merely because `G` occupies the old position;
- revision tag `approved` still follows only `RA`, so the tagged-folder result
  continues to differ under `L-A` and `L-B`;
- an implementation whose tag bitmap is keyed only by mutable directory
  position, without verifying the currently selected File/revision, fails.

### J4 — Remove without erasing

Remove `/published/brief.txt` with a selected whiteout/mask under the active
namespace policy, so lower-tier fallthrough is explicitly not the behavior
under test.

Minimum observations:

- under `L-A`, a complete current folder listing and folder-scoped tag listing
  omit `F`; Alice's selected whiteout blocks the lower Bob placement;
- under `L-B`, Bob's higher-priority placement remains visible. Changing only
  the namespace order explains the difference; neither view invents absence;
- the exact File, revisions, tags, authored evidence and name history remain
  addressable by identity;
- removal is distinguishable from missing bytes, partial coverage and encrypted
  content;
- an unknown higher-priority source or incomplete page stops selection. It never
  reveals a lower-priority File as though removal were proved.

### J5 — Restore as a new current statement

Restore the placement of the same File `F` at `/published/brief.txt`, choosing
the old `R0` content. The restore creates `RR`, a new immutable revision, and a
fresh placement/head statement; it does not resurrect an old mutable cell.

Minimum observations:

- `FileId(RR) == F`, `RevisionId(RR) != RevisionId(R0)`, and the verified byte
  commitments for `RR` and `R0` match;
- `project_efs` still applies because its subject is `F`;
- `draft` remains a statement about `R0`, not automatically about byte-equal
  `RR`; `approved` remains about `RA` and is no longer a selected-revision hit
  under `L-A` after Alice selects `RR`;
- `L-B` may still select Bob's `RB`. Restore does not overwrite Bob's history or
  force every viewer onto Alice's choice;
- name and revision histories show removal and restore as new evidence.

## Churn and fixed-basis listing probe

The names `note.txt` and `brief.txt` have now been bound, masked and rebound
while only a small current set remains. Enumerate `/drafts/` with underlying
page size `1`. A page that scans only a masked historical position may yield
zero visible rows and a non-final cursor; it is **partial progress, not an empty
directory**. After all pages at basis `B1`, the current result is exactly the
selected live set (including `G`), with no duplicate or ghost.

After page one, admit `/drafts/later.txt` at basis `B2`. Continuation from the
`B1` cursor must remain at `B1` and omit the later File. A fresh `B2` listing
may include it. Repeat the same rule for the folder-scoped File-tag and
selected-revision-tag queries. Vary lifetime churn separately from live count;
the tiny case proves semantics, while larger `N` only measures growth. No
specific production count follows from this fixture.

Only after the micro-case passes, run one matched scale observation using the
sprint's proposed experimental dimensions: 1,000 live entries and a separate
10,000 lifetime-name history, with query page size and finite gas/RPC/time
budgets frozen before candidate integration. These numbers are workload probes,
not protocol caps or product requirements. Report latency, paid-read gas, RPC
calls/bytes, state growth and rebuild/backfill work. `UNSUPPORTED` or a resource
limit is honest evidence, not a pass and not permission to raise the budget
after seeing a result.

## Journey's exercised contract-usable query floor

“Contract-usable” means an unrelated Solidity consumer can obtain and check a
bounded result from Realm state at an explicit basis without an off-chain party
approving the answer. It does not require a globally sorted folder in one call,
and it does not prescribe a materialized index: bounded reconstruction is
eligible if its coverage, gas and worst supported churn are honest.

| Required behavior | Minimum result |
|---|---|
| Resolve path | selected File/directory identity or qualified non-presence; selected revision for a File; Lens/policy and basis; authority/profile/result grade |
| Resolve stable File head | selected revision or conflict/unknown under the supplied content policy and basis |
| Read exact revision/history | exact revision body/commitment and bounded parent or history pagination; old evidence remains reachable after remove/restore |
| List folder | bounded current entries plus an opaque continuation bound to folder, Lens/policy and basis; explicit completeness/coverage |
| Test an exact tag stance | subject kind (`FILE` or `REVISION`), subject identity, concept, author/policy, basis and effective stance |
| List tagged Files within a folder | bounded results produced from the same selected placement/head semantics as point open, plus continuation and coverage |
| Inspect selected content | exact commitment/digest, size/media metadata, byte-availability grade and bounded Locator selection; arbitrary large bytes and decryption are not required contract outputs |

For this fixture, single-tag exact lookup is enough. If a candidate cannot make
the joined folder-plus-tag query affordable as one bounded call, it may expose a
bounded folder page plus per-result tag checks; price the consuming-contract
loop. Moving the whole operation to a hosted indexer is a changed guarantee, not
an optimization.

This is only the journey's exercised floor, not the complete Core query freeze.
Omitted owner-carried obligations—including records by known Type, typed
backlinks, reverse membership/cited-by, content-digest lookup, author recovery,
revocation-aware counts and deterministic best-Locator selection—cannot be
counted as a candidate saving or silently waived here.

Optional enhanced discovery may add full-text, fuzzy/ranked relevance,
semantic similarity, trending/popularity, cross-Realm search, global analytics,
ranked/deep or catalog-derived tag-hierarchy expansion, or unbounded/global
NOT/OR/intersections. These features must declare their provider and coverage,
degrade visibly, and never be the only path to the required rows above.
Client-side collation or thumbnails are presentation, not contract query
obligations.

## Cold static-browser and failure subruns

Read-only reconstruct the committed checkpoints after J2, J3 and J5 from a
fresh browser profile with empty HTTP/memory caches, service workers, Cache API,
IndexedDB and local/session storage. The cold browser does not execute those
writes. Serve only the static application. Its network trace may contain the
explicitly selected public Realm RPC and eligible content carriers; it contains
no EFS application server, wallet/account, Commons, OS/profile hydration,
package catalog, hosted indexer or hidden fixture API. Deep-link and reload must
reconstruct the same qualified outcomes at the pinned basis. Fetch and verify
the selected current bytes plus one historical revision; expose a byte-exact
download and render only after commitment verification.

Inject these failures independently:

| Injection | Required observable result |
|---|---|
| Required listing page unavailable | Retain loaded rows but label the inventory `PARTIAL`/`UNKNOWN` with missing coverage and resumable cursor; never “complete”, “empty” or negative-cache |
| Alice's higher-priority namespace head is unavailable while Bob's placement is readable under `L-A` | Return `UNKNOWN` and retain the lower candidate as evidence; do not fall through and display Bob's File as selected |
| Optional enhanced index omits `F` | Base point/list/tag reads still reconstruct the fixture; enhanced result states partial coverage and cannot change truth |
| Required index update fails during a write | The write is rejected/rolled back atomically; no point/list/history disagreement |
| Writer closes after submission but before receipt/read-back | In a later writer-capable session, reconcile by exact operation identity/nonce and canonical read-back before retry; never duplicate an effect or convert uncertainty to failure |
| Selected revision's carriers are exhausted with complete eligible coverage | File remains present; bytes are `BYTES_UNAVAILABLE` |
| Eligible carrier coverage is itself incomplete | File remains present; byte state is unknown/partial, not unavailable-proved or absent |
| Primary returns corrupt bytes, fallback returns matching bytes | Render only verified fallback; retain the tampered attempt and commitment |
| Content is encrypted and no key is present | Show `ACCESS_REQUIRED`/`OPAQUE`; do not claim plaintext, absence or decryption. Public indexed metadata remains public |
| Encrypted-directory profile is unsupported | Stop at the mount as opaque; do not enumerate or infer children |

Encryption is the consequential tradeoff: base contracts cannot decrypt private
values, and mandatory public discovery exposes the indexed graph even if bytes
are ciphertext. A metadata-private folder therefore needs a separate encrypted
manifest/profile and cannot be smuggled into this public fixture as “the same
query, cheaper.”

The interrupted-write recovery journal may retain only the public action shape,
commitments, operation identity/nonce, transaction hashes, receipts and
read-back evidence. It never retains content bytes, signing witnesses, private
keys or ambient credentials. This writer recovery arm is separate from the
wallet-free cold guest run.

## Independent oracle

Browser, SDK and Solidity agreement can repeat one shared bug. For each road,
an independently implemented oracle reads the frozen fixture's raw admitted
state and candidate-published codec/semantics without calling that road's
resolver, query adapter, indexer or SDK. It independently checks File/revision/
placement identity relationships, both Lens selections, tag subject kinds,
page coverage and exact byte digests. Candidate physical encodings may differ;
the expected semantic matrix above does not.

Compare the browser and the paid unrelated-contract consumer to that oracle at
the same immutable graph revision. If the paid transaction necessarily lands at
a later block, admit no intervening graph mutation and retain both bases; hash
agreement alone does not excuse semantic disagreement.

## Evidence captured per candidate

Record, without normalizing away architectural differences:

- exact source/configuration pin and which outcomes are demonstrated,
  designed-but-untested, unsupported or unknown;
- the independent oracle implementation/source pin and its result against each
  browser, SDK and Solidity read;
- receipt gas and persistent growth for setup, each logical write, failed
  mandatory-index write and restore;
- paid Solidity gas for point, history, folder page and joined tag query;
- cold-browser RPC calls, batches, response bytes, carrier bytes and latency;
- every external obligation: index maintenance, proof generation, relayer,
  retention, cache or trusted service, including who operates and pays for it;
- user signing/approval count and whether one logical action can partially land.

Internal Record/table count is explanatory evidence only. A cheaper candidate
wins this journey only by preserving the same outcomes with lower complete cost
or maintenance burden, not by dropping an outcome and scoring the unknown as a
pass.

## Stop conditions and handoff

Stop a candidate's Files expansion and report the first failing row if it:

- changes File identity on edit/rename/move/restore, or mutates/reuses an old
  revision identity;
- exposes one global head where `L-A` and `L-B` must disagree, silently chooses
  an equal-rank conflict, or filters before selection;
- attaches File truth to a path so tags leak to `G`, or treats File and revision
  tags as interchangeable;
- produces a folder/tag listing that disagrees with opening each returned path,
  mixes bases, loses/duplicates rows, or calls partial coverage complete;
- needs a hosted indexer/EFS server/wallet/warm cache for any required cold
  guest result;
- turns remove, timeout, missing bytes, corrupt bytes, unsupported encryption or
  incomplete history/index coverage into semantic absence;
- lets a required index fail independently of the write it promises to cover;
- retries an uncertain submission before reconciliation, duplicates an effect,
  or requires retained secrets/content bytes to recover;
- agrees only through a shared resolver/SDK and fails the independent oracle; or
- cannot expose the required bounded queries to an unrelated contract within
  its stated execution limit.

Passing this file journey is necessary, not sufficient, for the sprint's joined
finalist. Portable export/import, arbitrary developer validation, checked
references, account/rule changes and long-horizon availability retain their
separate gates in [[overhead-and-selection]].

The requirement tradeoffs to carry to the coordinator are therefore ordinary
and narrow:

1. **One global latest version is cheaper, but two communities can no longer
   disagree without forking the File.** Keep independent selection unless James
   explicitly chooses a single-author profile.
2. **An optional search server is cheaper, but a fresh Realm and another
   contract can no longer discover the promised folder/tag result.** Keep the
   bounded base queries; leave ranking and global search enhanced.
3. **Path-keyed tags are cheap, but moving a document or replacing a path changes
   what the tag means.** Keep explicit File-versus-revision subjects.
4. **Encrypted bytes hide content, not public graph metadata.** A promise of
   metadata-private folders is a different profile with different costs and
   failure behavior.
