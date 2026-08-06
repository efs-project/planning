# EFS portable Git profile and library pressure test

**Status:** research/design handoff; candidate library boundary and acceptance suite, not an adopted architecture or implementation authorization

#kind/review #status/done #repo/planning #repo/sdk #repo/client #topic/efsv2 #topic/git

## Product requirement being tested

James's standing objective:

> EFS should support credibly neutral Git code hosting, and EFS folders containing Markdown or other source-like files should be able to opt into efficient, ordinary Git history and collaboration.

The first honest target is not “GitHub replacement.” It is:

> A public repository can be cloned, fetched, pushed, browsed, verified, mirrored, exported, and independently restored without its identity, ref history, or required object closure depending on one EFS domain, database, gateway, storage network, or wallet vendor.

GoE has already demonstrated one backend path. The EFS task is to reuse that path where safe while supplying portability, ordinary interoperability, authority evolution, plural placement, and later forge objects.

## Reuse decision

### Reuse or contribute

- ordinary Git objects, packs, bundles, refs, and native Git commands;
- GoE's remote-helper and commit-boundary pack work;
- EthStorage SDK/FlatDirectory blob upload and download behind an adapter;
- the GoE contract/event model as prior art and an interoperability target;
- Git's `index-pack`, object validation, smart HTTP/SSH protocols, SHA-1/SHA-256 object formats, and Git LFS standards;
- established forge protocols/data models such as Forgejo/Gitea, ForgeFed/F3, and Radicle as evidence for later collaboration.

### Do not adopt unchanged

- the current GoE deployment/contracts before a production-scoped independent review;
- a repository contract address as portable repository identity;
- wallet-required anonymous reads;
- SHA-1-only fixed fields;
- sequential non-atomic multi-ref behavior;
- one EthStorage endpoint or GoE push-record list as the sole recovery source;
- Git as the universal data model for every EFS folder;
- a custom Git implementation where stock Git libraries/processes suffice.

## Candidate library boundary

The dedicated design pass should evaluate a small **portable Git profile/library**, not a monolithic forge and not Git-specific kernel logic.

### 1. Native Git object layer

Responsibilities:

- preserve exact Git object bytes/OIDs and refs; preserve a pack or bundle byte-for-byte only when it is explicitly archived by digest, while allowing normal pack/index regeneration;
- represent OIDs as `(algorithm, digest)` and support SHA-1 plus SHA-256 repositories;
- use native Git/libgit2/JGit/isomorphic-git implementations rather than rewriting pack/object algorithms;
- validate packs, thin-pack prerequisites, object closure, and resource limits;
- compute both Git OID and canonical EFS digest over the same bytes without duplicating the byte payload.

The Git OID remains the Git object's identity. An EFS DATA/object ID, storage digest, repository ID, and placement locator remain distinct.

### 2. Repository descriptor and authority layer

Candidate portable repository descriptor:

- stable `repoId` independent of host, chain, and carrier;
- Git object-format algorithm;
- genesis/default-ref declaration;
- authority/KEL principal and policy epoch;
- delegates/roles and credential bindings;
- immutable creation record plus explicit migrations/successors;
- current repository-policy reference;
- export/profile version.

This belongs in generic signed EFS records/application schemas if they can express it. Do not add a `GIT_REPO` kernel kind without a failed generic acceptance test.

### 3. Ref-transaction layer

A ref update record should bind:

- `repoId`;
- one or more `(refName, expectedOldOID, newOID)` changes;
- Git object algorithm;
- actor/principal and credential binding;
- authority-policy epoch;
- prior ref-transaction/sequence or other freshness basis;
- force/delete intent and policy result;
- referenced object-closure/pack evidence;
- timestamp/venue/basis as appropriate;
- signature.

Required behavior:

- compare-and-swap freshness;
- atomic multi-ref updates when advertised;
- explicit conflict rather than silent last-writer-wins;
- default fast-forward policy checked by a Git-aware verifier/gateway;
- force-push displacement retained and recoverable;
- replay and policy-rollback resistance;
- per-writer/conflicting views preserved when no policy selects one canonical head.

The first hypothesis remains a generic signed multi-ref transaction plus Git-aware gateway validation. Reopen the EFS kernel only if that cannot pass without state-dependent universal admission.

### 4. Placement-adapter layer

Interface responsibilities, independent of one language:

```text
put(object-or-pack, expectedDigest) -> placement receipt
get(placement, range?) -> bytes + evidence
probe(placement) -> availability/proof observation
verify(bytes, receipt, expectedDigest) -> result
repair(source placement, target adapter) -> new receipt
export(repository closure) -> ordinary Git bundle/objects + EFS sidecar
```

First adapters to compare:

- production-reviewed GoE/EthStorage backend;
- conventional bare-Git/HTTPS storage;
- deterministic Git bundle placement on another carrier;
- local filesystem/OPFS for offline work.

Pack layout is a cache/transport optimization. Repository identity and required object closure must not depend on one provider retaining one historic pack decomposition.

### 5. Stock Git gateway

Provide replaceable smart HTTP and/or SSH gateways that translate ordinary Git operations into the portable profile:

- wallet-free anonymous `clone` and `fetch`;
- normal Git credentials, SSH keys, passkeys, or scoped tokens mapped to EFS authority/delegation;
- `upload-pack`/`receive-pack` and protocol v2;
- ref CAS and atomic capability honesty;
- pack/object resource controls;
- reconstructible bare-repository caches;
- no private gateway database as the sole ref or authority history;
- documented endpoint rebuild from exports/placements.

An `efs://` or `goe://` helper remains useful for direct/native access and testing. It cannot be the only public path if ordinary developers and automation are a goal.

### 6. Workspace bridge for Markdown and EFS files

Git backing should be explicit per folder/workspace, not implicit for every EFS object.

#### Normal workflow

1. A user opens or creates an **EFS Git workspace**.
2. The client materializes a normal working tree in local filesystem/OPFS storage.
3. Markdown and ordinary files are normal Git blobs; Git status/diff/stage/commit/branch/merge work normally.
4. A commit produces native Git objects and advances only the local ref; it does not advertise a durable remote head.
5. A later sync places the missing required object closure through one or more adapters, potentially including GoE/EthStorage, and only then records/admits the portable remote ref transaction.
6. The EFS file browser displays Git status, history, diff, blame, branches, restore, and conflict state without pretending uncommitted local changes are already durable/public.
7. Published EFS references may point to an exact commit/tree/blob or to a policy-selected mutable ref; the UI distinguishes them.

#### EFS relationship

- A Git blob/tree/commit remains native Git data.
- An EFS repository identity and ref history wrap the repository without rewriting Git objects.
- An EFS file identity may link to the current or exact Git-backed version when the workspace wants identity across renames/hosts; normal Git export must still work without EFS metadata.
- EFS provenance may record who published/accepted a commit/ref transition, but must not claim Git commit author email is verified identity.
- A deterministic sidecar/export carries EFS-specific authority, placements, schemas, and forge objects.

#### Efficiency

- Hash the file bytes once per needed digest algorithm and store one byte payload where adapters permit content deduplication.
- On publish, upload only missing newly reachable Git objects/packs, and never advertise the remote head before its required placement succeeds.
- Repacking may change physical packs without changing Git OIDs or EFS repository identity. Pruning is allowed only after retention policy proves that no retained/displaced ref or required export still needs the objects.
- Use Git LFS pointer and transfer protocols for large EFS-backed files rather than inventing a new pointer syntax. A client without LFS support should honestly receive pointers.
- Preserve offline commits locally and label their placement/admission state until synchronization completes.

#### Conflict behavior

Use ordinary Git merge/rebase/conflict semantics inside the workspace. EFS may preserve competing signed ref proposals, but the official client must not silently merge Markdown or choose a winner without an explicit repository policy/user action.

### 7. Portable forge layer, later

Issues, patch/pull-request revisions, reviews, inline comments, labels, releases, and merge records should be portable signed application objects linked to repository identity and exact commits.

Do not block the first Git host on building all forge features. Do ensure the repository/ref/profile design leaves room for them and preserves attribution, revisions, policy, and export.

Search, stars, rankings, CI, notifications, and default gateways are derived/service planes. They must not become repository authority.

## Acceptance suite

### Core Git

- round-trip SHA-1 and SHA-256 refs and every required/reachable object without OID or object-byte changes;
- anonymous stock-Git clone/fetch without wallet or custom helper;
- authenticated stock-Git push;
- branches and annotated/lightweight tags;
- atomic two-ref push, rejected wholly on one stale expected ref;
- fast-forward rejection and explicit force-push audit/recovery;
- concurrent maintainers and conflicting proposals;
- interrupted multi-pack upload/resume without partially advertised broken head;
- produce an equivalent clean clone after repacking to a different physical pack layout;
- thin/malformed/oversized/object-bomb rejection;
- Git LFS round trip;
- partial/blobless clone if claimed.

### Portability and neutrality

- stable `repoId` while moving GoE/EthStorage → ordinary gateway → alternate carrier;
- rotate/recover repository authority without changing `repoId` or Git history;
- rebuild smart-HTTP endpoint from public specs, portable records, bundles/objects, and alternate placements;
- remove all EFS-operated services and original backend;
- detect missing closure and repair it;
- preserve exact displaced ref states after force push;
- distinguish unavailable bytes from nonexistent repository/ref;
- operate two independent gateways that derive the same policy-selected refs from the same evidence.

### Markdown workspace

- edit two Markdown files offline, inspect diff, commit, and later synchronize;
- rename/move a file while preserving ordinary Git semantics and any explicitly linked EFS identity;
- two users edit the same paragraph and receive a normal visible conflict;
- deep-link to exact commit/file without authentication;
- deep-link to moving branch with displayed resolution basis;
- restore an earlier version through Git and publish a new ref transition;
- export to GitHub/Forgejo and re-import without byte/history loss;
- verify only new objects were uploaded for a small edit;
- large asset travels through standard LFS behavior with EFS-backed storage.

### GoE compatibility

- clone/fetch/push through a fixed GoE adapter;
- import observed GoE repo/branch/push records without treating contract address as portable identity;
- mirror all required packs to a second carrier;
- reconstruct after GoE RPC/storage unavailability;
- detect and reject unsupported or unreviewed deployments;
- compare GoE native refs with EFS portable ref transactions and document every loss/conversion.

## Decision gates

After a production-scoped independent review and the tests are built:

1. **Adopt GoE as first backend** if it passes security, pack completeness, recovery, and adapter tests.
2. **Contribute/fork narrowly** if its helper/storage work is sound but repository/ref contracts or maintenance do not meet requirements.
3. **Use EthStorage directly behind an EFS Git adapter** if GoE's contract model is unnecessary while the SDK/storage rail is useful.
4. **Build new generic repository/ref libraries** only for gaps not already satisfied by stock Git plus safe GoE components.
5. **Do not ship a Git-host claim** if the result is only a downloadable archive/bundle; call that a Git archive prototype.

## First bounded implementation handoff

The eventual design/implementation thread should produce one thin vertical slice:

1. import an ordinary Markdown-heavy repository;
2. publish a stable EFS repository descriptor and complete verified bundle/object closure;
3. mirror objects to a conventional backend plus EthStorage/GoE-compatible placement;
4. serve anonymous clone/fetch and file/commit/diff pages;
5. accept one authorized normal push and one atomic two-ref push;
6. record replay-safe ref transitions and force-push recovery evidence;
7. edit/commit Markdown through an explicit EFS workspace;
8. remove the original gateway and EthStorage endpoint;
9. rebuild under an independent hostname from the alternate carrier/export;
10. compare exactly what GoE supplied, what EFS added, and what remains unproved.

That experiment is sufficient to decide library boundaries. It does not require building GitHub, CI, organizations, private repositories, or the full EFS OS first.
