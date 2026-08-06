# GoE deep dive — Git transport solved, neutral forge not solved

**Status:** finished point-in-time review; adopts no backend, contract, library, partnership, implementation, or v2 requirement
**Agent:** pm (Codex), 2026-08-05
**Evidence:** public GoE CLI/contracts/design source at pinned revisions; npm package and download metadata; bounded Sepolia deployment/event reads; native Git behavior; EthStorage SDK/storage path; current EFS Git priority brief; independent architecture and trust-boundary review
**Corpus:** [`2026-08-05-goe-corpus/`](./2026-08-05-goe-corpus/README.md)
**Parent storage review:** [`2026-08-05-ethstorage-deep-dive.md`](./2026-08-05-ethstorage-deep-dive.md)
**Potential feeds:** EFS Git profile/library · SDK placement adapters · repository authority/KEL · guest repo browser · Markdown workspaces · preservation/export · later portable forge

#kind/review #status/done #repo/planning #repo/sdk #repo/client #topic/efsv2 #topic/git

## Executive verdict

GoE has solved a useful thin vertical slice:

> A custom Git remote helper can create ordinary Git packfiles, store them through EthStorage, keep branch/access state in Ethereum contracts, and support real clone/fetch/push workflows on Sepolia.

That is substantial prior art. EFS should not rebuild Git object/pack mechanics or pretend Git-on-Ethereum is untouched territory.

GoE has not solved credibly neutral Git hosting or a decentralized GitHub. It currently lacks stock anonymous Git access, tags, SHA-256 repositories, atomic multi-ref pushes, strong/ref-complete history, portable repository identity, authority recovery, plural carriers, clean-room restoration, web browsing, and forge collaboration. It is a young cross-contract testnet prototype, so production adoption also requires exhaustive authorization/integration testing, a migration story, and independent review.

The recommended relationship is:

- **reuse standard Git;**
- **contribute to or wrap a production-reviewed GoE as one optional pack-placement/transport adapter;**
- **keep portable EFS repository identity, authority, ref transactions, storage placements, recovery, and forge objects above it;**
- **do not adopt the current deployed contracts as production infrastructure.**

The existing [[2026-07-29-pm-credibly-neutral-git-forge-and-agent-artifacts]] brief is directionally stronger than GoE's present implementation. GoE validates and sharpens the brief rather than replacing it.

## What is genuinely implemented

[`goe-cli@0.2.0`](https://github.com/ethstorage/goe-cli/tree/2ee0cf5abe981e27e102582e451827074f38a793) exposes:

- `git-remote-goe` for Git's custom remote-helper protocol;
- `goe` for wallets, repository creation/listing, branches, default branch, and roles.

The helper supports:

- `git clone`/fetch through `goe://`;
- ordinary branch push;
- force push;
- branch deletion except the default branch;
- native `git pack-objects` generation;
- incremental pack splitting around a 10 MiB target;
- pack upload/download through `ethstorage-sdk`;
- pack import and integrity checking through `git index-pack`;
- address-based push/maintainer roles.

This is a real Git remote prototype, not merely a whitepaper. A resulting clone is an ordinary Git repository and can be pushed to a conventional host, which is an important exit property.

## How it works

```text
ordinary Git command
        │
custom goe:// remote helper
        │
GoeRepo clone on Sepolia
roles · branches · heads · logical push records
        │
per-repository FlatDirectory
        │
EthStorage testnet packfile chunks
```

A push reads the current head, makes one or more thin packs, uploads each pack, and sends a separate ref-update transaction for each pack. A fetch walks the branch's active push records, determines which packs the local repository lacks, downloads them, and runs `index-pack`.

The repository's current GoE identity is effectively `(chain ID, repository contract address)`. Owner/name shorthand is Hub discovery. That is a useful backend locator, not a sufficient portable EFS repository identity.

## Where “fully Git compatible” overstates reality

### Custom install and wallet required

Developers invoke ordinary Git commands only after installing the Node-based remote helper. The released helper also unconditionally loads an unlocked GoE wallet while initializing list/fetch behavior. Public clone is therefore not anonymous/no-wallet in the current product.

There is no standard smart-HTTP or SSH endpoint. An ordinary machine, browser, CI runner, or archival tool cannot use built-in Git transport against `goe://` without installation and GoE key setup.

### Only branch refs and SHA-1-shaped OIDs

- non-branch ref push is rejected; tag support is TODO;
- OIDs are fixed `bytes20`/40-hex values;
- SHA-256 repositories are unsupported;
- notes, replace refs, partial clone, Git LFS, and other modern modes are absent.

### Pushes are not atomic

Multiple requested refs and multiple packs for one branch are processed sequentially. Failure can leave orphan packs, an intermediate branch head, or earlier refs committed while later refs fail. GoE must not advertise Git's atomic-push capability.

### Fast-forward is not contract-verified

The contract compares the supplied parent OID with the current head. The official helper checks real ancestry with Git, but a modified authorized client can bypass that client-side policy. This is single-ref CAS plus honest-client behavior, not consensus verification of the Git graph.

### Pack identity is too weak

The released helper uses an ending commit OID as a mutable FlatDirectory pack key. The same commit can end differently packed or thin packs depending on base objects, packing version, branch, or force-push context. GoE's contract records key and length but not a committed immutable pack digest or complete object closure.

Git OIDs and `index-pack` still provide real object-integrity checks. They do not ensure the referenced pack mapping remains available or that it contains every object required for the advertised ref.

### Force-push recovery is weak

Force push logically truncates/overwrites the active push-record sequence. Ethereum history remains forensic evidence, but current getters no longer expose the displaced tail, events omit critical pack/ref recovery detail, and no reflog/recovery procedure is documented.

## Design document versus implementation

The earlier, open and unmerged [`ethfs-git` design PR at `0be0b9c`](https://github.com/ethstorage/ethfs-git/blob/0be0b9c5ddedd1e60b6d94edbc35703ef96d023b/design.md) contemplated more than 0.2.0 shipped (the current main branch's `design.md` is empty):

- atomic multi-ref transactions → implementation updates one ref/chunk at a time;
- SHA-1 and SHA-256 → implementation fixes 20-byte OIDs;
- deterministic repository addresses → Hub uses ordinary clone creation;
- committed pack hash → implementation records a mutable key and length;
- richer events → current events omit pack descriptors and plaintext ref names;
- ENS/organization/governance and GitHub-like features → not in the released product.

Future designers should evaluate running code and deployed state first, while retaining the design as useful intent.

## Current deployment and maturity

Released 0.2.0 is Sepolia-only and hardcodes one plain-HTTP Ethereum RPC, one official EthStorage testnet RPC, and one Hub.

Bounded live inspection found:

- 29 repository-creation events from January through early February 2026;
- 22 repositories named like automated `goe-e2e-*` tests;
- 17 repositories with ref activity;
- one small `hello-world` repository with several pushes by two addresses;
- no evidence of a released mainnet deployment or broad production adoption.

npm reported 735 raw downloads over the prior year. Downloads and repository events are not users.

The project's own large-repository test reports that approximately 145.7 MiB took 3 hours 25 minutes to upload, 7.86 minutes to download through GoE, and 4 minutes through ordinary Git HTTP, costing under 0.7 Sepolia test ETH. This is useful prototype evidence—and strong evidence that Markdown editing must commit locally and batch/asynchronously publish, never transact on every save.

## Production security gate

This pass was an architecture and source review, not a complete production security audit. GoE crosses repository, forwarding, FlatDirectory, SDK, Ethereum RPC, and EthStorage boundaries, so production adoption requires a fixed source-linked release, exhaustive authorization/integration tests against the real deployed ABI, a migration plan, and independent review.

See [`security-and-trust-boundaries.md`](./2026-08-05-goe-corpus/security-and-trust-boundaries.md) for the general threat model and pre-adoption evidence gates.

Other important policy gaps include incomplete pusher/maintainer behavior, branch-creator force authority surviving role revocation, client-trusted fast-forward checks, hidden displaced ref records, sequential partial updates, and concentrated endpoint configuration.

## What GoE has not built

- stable repository identity through chain/contract/backend migration;
- KEL-style authority rotation/recovery and policy epochs;
- plural complete pack/object placements and active repair;
- stock wallet-free HTTPS/SSH clone and push;
- web file/tree/commit/history/diff browsing;
- issues, patches/pull requests, reviews, releases, organizations, search, or CI;
- moderation, abuse, malware, secret-leak, and unreachable-history operations;
- independent indexes/gateways and clean-room reconstruction;
- portable forge collaboration data.

It is decentralized pack transport plus branch coordination, not yet a neutral forge.

## Candidate EFS portable Git library/profile

The separate [pressure-test handoff](./2026-08-05-goe-corpus/efs-git-profile-pressure-test.md) lines up a modular design pass:

1. **Native Git object layer:** stock Git objects, packs, bundles, and algorithm-tagged OIDs.
2. **Portable repository descriptor:** stable EFS `repoId`, object format, authority/KEL root, policy epoch, and migrations.
3. **Signed ref transaction:** atomic set of expected-old/new refs, actor, policy epoch, freshness basis, force intent, and object/pack evidence.
4. **Placement adapters:** fixed GoE/EthStorage, conventional Git, deterministic bundles on another carrier, and local/offline storage.
5. **Stock Git gateway:** replaceable smart HTTP/SSH with wallet-free reads and reconstructible caches.
6. **Workspace bridge:** explicit Git-backed EFS folders with ordinary status/diff/commit/branch/merge/restore for Markdown and code.
7. **Portable forge layer later:** issues, patch/PR revisions, reviews, releases, and policy-linked merge records.

No Git object model or pack implementation should be reinvented. No Git-specific kernel kind should be added until a generic signed-record/placement prototype fails.

## Markdown-backed EFS files

Recommended candidate behavior:

- a folder explicitly opts into Git workspace mode;
- edits save immediately to a local working tree/journal;
- Markdown bytes remain ordinary Git blobs;
- users commit meaningful checkpoints locally, then publish asynchronously;
- on publish, place the missing required object closure; physical packs may be regenerated without changing Git object identity;
- normal Git merge/conflict behavior remains visible;
- exact EFS links may bind to a commit/tree/blob, while moving links resolve a named ref through explicit policy;
- EFS-specific stable file IDs/provenance may travel in portable bindings/sidecars without breaking normal Git export;
- large files use standard Git LFS pointer/transfer behavior with EFS-backed bytes;
- public files, commits, and diffs open without wallet or full OS initialization.

This supplies efficient, trackable Markdown editing without making every EFS folder a repository or making blockchain latency part of the editor save loop.

## Use/build decision rule

After a production-scoped independent review and supported release:

- **Use GoE as the first backend** if it passes security, immutable pack/closure, recovery, and adapter tests.
- **Contribute or fork narrowly** if its helper/storage work is valuable but its contract/ref model remains unsuitable.
- **Use EthStorage directly** behind an EFS Git placement adapter if GoE's repository contracts add no necessary value.
- **Build only the portable layers GoE lacks:** repository identity, authority, ref transactions, gateways, plural placement/repair, export, and later forge data.
- **Call an import/bundle-only result a Git archive prototype**, not a Git host.

## Disposition

- Preserve GoE as real working prior art and a candidate integration, not a solved neutral forge.
- Keep the existing Git deep-dive/prototype card open: this research answers “what GoE is,” not whether EFS's generic design passes the acceptance suite.
- Use the library/profile handoff as the frame for a dedicated design/implementation thread.
- Do not build a feature-complete GitHub clone before the thin repository/ref/placement/walk-away slice works.

**Recommended next technical evidence step:** run the thin portable-Git prototype against a production-reviewed GoE backend and an alternate carrier.
