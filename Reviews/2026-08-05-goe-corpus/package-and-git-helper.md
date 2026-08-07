# GoE package and Git remote-helper behavior

**Status:** pinned-source/package review of `goe-cli@0.2.0`, verified 2026-08-05

#kind/review #status/done #repo/planning #topic/git #topic/storage

## Correction to the earlier research snapshot

GoE is not design-only and the CLI is no longer npm-only.

The public [`ethstorage/goe-cli`](https://github.com/ethstorage/goe-cli) repository contains TypeScript source, tests, lockfile, and build configuration. Its audited head `2ee0cf5` matches npm package metadata's `gitHead` for `goe-cli@0.2.0`. The package exposes two executables:

- `git-remote-goe` — Git's custom remote-helper entry point;
- `goe` — wallet and repository administration CLI.

The open, unmerged [`ethfs-git` design PR #1 at `0be0b9c`](https://github.com/ethstorage/ethfs-git/blob/0be0b9c5ddedd1e60b6d94edbc35703ef96d023b/design.md) is the earlier design-lineage artifact. Main currently contains only an empty `design.md`; neither surface is the released implementation.

## User workflow

The documented path is:

1. install `goe-cli` globally;
2. create and unlock a dedicated local Ethereum wallet;
3. create a repository through the GoE Hub on Sepolia;
4. configure `goe://<repo-address>:11155111` as a Git remote;
5. use ordinary `git push`, `git fetch`, or `git clone`, which invoke the custom helper;
6. use `goe repo` commands for listing repositories/branches, selecting a default branch, and changing push/maintainer roles.

This is meaningful Git integration: after installing the helper, users invoke normal Git commands and Git hands protocol operations to GoE.

It is not zero-install stock Git hosting. An unmodified computer cannot clone a `goe://` URL through Git's built-in HTTPS/SSH transports.

## Implemented remote-helper capabilities

The helper advertises Git remote-helper `option`, `fetch`, and `push` capabilities. Source implements:

- listing branch refs and a synthetic `HEAD` from the default branch;
- discovering missing push records relative to local objects;
- downloading referenced packfiles from EthStorage;
- importing normal and thin packs through `git index-pack`;
- ordinary branch pushes;
- explicit force pushes;
- branch deletion;
- pack generation using native `git pack-objects`;
- commit-boundary pack splitting around a nominal 10 MiB target, not a hard upper bound;
- sequential blob upload through `ethstorage-sdk`;
- sequential contract ref updates;
- local fast-forward/ancestry checking;
- encrypted local wallet storage using a password-derived key and system-keychain support.

This proves the narrow core proposition:

> Git objects can be exchanged as ordinary packfiles while Ethereum contracts carry ref/access metadata and EthStorage carries the pack payloads.

EFS should not recreate pack generation, `index-pack`, delta handling, or basic remote-helper protocol from first principles.

## Network and identity assumptions

Version 0.2.0 contains one configured network:

- Sepolia chain ID `11155111`;
- Hub `0xe0CAb641c88d7E00D4fEfC91aD87657FFd2Af79E`;
- one hardcoded plain-HTTP Ethereum RPC;
- one official EthStorage testnet RPC.

Repository URI forms ultimately resolve to a deployed repository contract. The contract address is described as canonical in the GoE documentation.

That is a useful location/transport identity for the prototype. It should not become the canonical EFS repository identity because it binds the repository to one chain, deployment family, implementation, access-policy contract, and storage backend.

## Read path limitation

The helper constructs its `FlatDirectory` and contract driver using `WalletManager.getWallet()` even for list/fetch operations. A local GoE wallet must therefore exist and be unlocked to clone/fetch through the current helper.

Public source repositories should support wallet-free anonymous reads. A gateway may use an internal account/RPC implementation as an optimization, but readers must not need to create an Ethereum identity simply to clone public code.

## Git compatibility gaps

### Refs and object formats

- Push accepts only `refs/heads/*`; tags are explicitly marked TODO.
- Contracts and helper use fixed `bytes20` OIDs, binding the prototype to SHA-1 Git repositories rather than algorithm-tagged SHA-1/SHA-256 support.
- No notes, replace refs, or other Git ref namespaces are exposed.

### Atomicity

- Multiple requested refs are processed sequentially.
- One logical branch push may be split into several packs; each pack is uploaded and its intermediate head advanced sequentially.
- Later failure can leave storage uploaded and/or a branch partially advanced.
- No atomic multi-ref transaction matching Git's advertised atomic-push capability exists.

### Pack identity and closure

- The helper uses a chunk's ending commit OID as the mutable FlatDirectory key.
- The same ending commit can appear in differently constructed full/thin packs depending on excluded bases, branch, Git version, or packing heuristics.
- A later upload can therefore replace what an older push record retrieves under the same key.
- The contract records key and byte length, not an immutable pack digest, required base set, or complete object-closure proof.
- `git index-pack` supplies meaningful Git-object validation after download, but cannot prove in advance that every pack remains available or that the advertised ref is reconstructible.

### Standard serving and scale features

- No smart HTTP `upload-pack`/`receive-pack` gateway.
- No SSH server path.
- No protocol-v2 negotiation or stock anonymous clone endpoint.
- No partial/blobless clone or promisor-remote behavior.
- No Git LFS integration.
- No explicit object-retention/garbage-collection closure policy after force push.
- Fetch walks GoE push records and downloads the associated packs; performance and recovery depend on every required pack remaining available.

### Product/forge surface

No source browser, commit/diff UI, issues, pull requests, reviews, releases, organizations, search, notification, package, or CI system is part of GoE.

## Adoption and maintenance signals

- Latest npm release: `0.2.0`, published 2026-02-03.
- Audited source head: `2ee0cf5`, corresponding to the release merge.
- npm last-year download count on 2026-08-05: 735.
- The project is small but real and publicly inspectable.
- No mainnet configuration or current production deployment was found.
- The pinned [CLI Actions configuration](https://github.com/ethstorage/goe-cli/tree/2ee0cf5abe981e27e102582e451827074f38a793/.github/workflows) runs wallet-focused CI only on the `test` branch or manual dispatch; no automated clone/fetch/push workflow was found, and the contracts repository has no Actions workflow. The transport is therefore demonstrated but not visibly regression-tested end to end in CI.
- Licensing metadata is incomplete for copying: the CLI [`package.json`](https://github.com/ethstorage/goe-cli/blob/2ee0cf5abe981e27e102582e451827074f38a793/package.json) and contract-source SPDX headers declare MIT, the deploy script is `UNLICENSED`, and no top-level license text was present in the pinned CLI, contracts, or `ethfs-git` repositories.

The project's [`TEST_GUIDE.md`](https://github.com/ethstorage/goe-cli/blob/2ee0cf5abe981e27e102582e451827074f38a793/TEST_GUIDE.md) reports one approximately 145.7 MiB test taking 3 hours 25 minutes to upload and 7.86 minutes to download through GoE, versus 4 minutes for an ordinary Git HTTP clone, at under 0.7 Sepolia test ETH. This is project-reported testnet evidence, not a reproduced production benchmark. It supports local commits and asynchronous/batched publication rather than a remote transaction for every editor save.

Downloads include CI, repeat installs, research, and bots; they are not user counts.

## Reuse implications

Candidate reuse/contribution surfaces:

- Git remote-helper protocol parsing;
- commit-boundary pack creation and import;
- EthStorage SDK upload/download adapter;
- translation between Git refs and onchain records;
- test fixtures for interrupted upload, force push, and clone reconstruction.

Copying or forking code is conditional on explicit upstream license confirmation and dependency review. Until then, EFS can reuse Git standards and documented behavior or contribute fixes upstream without assuming a license grant absent from the repository.

Surfaces EFS should not inherit unchanged:

- wallet-required reads;
- a contract address as universal repository identity;
- single hardcoded RPC/provider configuration;
- SHA-1-only OID fields;
- non-atomic multi-ref/chunked pushes;
- provider-specific storage semantics leaking into the portable repository layer;
- the current contract deployment before a production-scoped independent review.
