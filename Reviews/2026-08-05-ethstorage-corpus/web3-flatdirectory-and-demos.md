# `web3://`, FlatDirectory, applications, and verified serving

**Status:** point-in-time product/source reference, verified 2026-08-05

#kind/review #status/done #repo/planning #topic/storage #topic/web3-url #topic/apps

## `web3://` is a request route, not a storage guarantee

[ERC-4804](https://eips.ethereum.org/EIPS/eip-4804) defines how a `web3://` URI is translated into a read-only EVM call. EthStorage founders contributed the standard and EthStorage ships gateways, libraries, browser tooling, and examples around it.

The URI does not itself define:

- where response bytes are stored;
- how bytes are uploaded or retained;
- whether a normal Ethereum node or an EthStorage-aware node serves them;
- encryption or access control;
- portable identity or authority;
- response safety, indexing, search, application sandboxing, or preservation;
- native support in mainstream browsers.

[ERC-6860](https://eips.ethereum.org/EIPS/eip-6860) remains a draft extension/cleanup. EFS should follow the open standards and compatible tooling without treating an EthStorage gateway as the standard's authority.

EFS v1's `web3://` path currently resolves its own contracts and bytecode storage. Using the URI does not mean EFS v1 stores payloads in the EthStorage provider network.

## FlatDirectory

FlatDirectory composes a file/directory-like API over chunked storage contracts and the EthStorage SDK. It is a useful integration surface because it handles:

- keys/paths over chunked values;
- uploads through calldata/contract-bytecode or blob-backed modes;
- partial reads and chunk metadata;
- SDK tooling compatible with EthStorage endpoints;
- static-site deployment patterns.

It should be evaluated as an adapter/library, not elevated into EFS's universal file model. FlatDirectory's contract ownership, key namespace, deployment, storage mode, update/delete behavior, and provider assumptions remain placement-specific.

## What the linked Devcon talk demonstrates

The [Devcon 6 archive](https://archive.devcon.org/devcon-6/on-the-future-of-web3-paving-the-way-to-end-to-end-fully-decentralized-web/) dates the linked talk to October 2022. It belongs to the Web3Q/W3Q predecessor period, before today's EIP-4844 EthStorage Mainnet Alpha.

The talk presents decentralized Twitter, Medium, and Dropbox as application possibilities. Its working file demonstration is the W3Drive/W3Box family. It is not evidence that a complete decentralized Twitter product existed.

That distinction should survive future presentations:

- **cataloged:** the official materials list file, blog, email, music, and static-web demonstrations; this review source-inspected W3Drive and dBlog but did not independently test every catalog application;
- **not verified:** Dropbox-grade synchronization/collaboration or Twitter-grade social-network functionality;
- **separate:** the current EthStorage provider protocol and later GoE work.

## W3Drive source teardown

Source inspected for this review: [`ethstorage/w3drive@f3c4a97`](https://github.com/ethstorage/w3drive/tree/f3c4a979cd66c98e39f2cf312ede7e9d7e15ee8e).

### What is real

- A wallet creates a drive record.
- Each user file is encrypted client-side with AES-256-GCM using wallet-signature/password-derived keys.
- Encrypted chunks, metadata, IVs, names, types, and timestamps can be written and read through a file contract.
- The frontend used the predecessor Web3Q/FlatDirectory serving stack at `web3q.io`; this does not establish deployment through current EthStorage Mainnet Alpha.
- The source demonstrates a comprehensible end-to-end user flow rather than only a protocol diagram.

### What the current user-file path actually uses

`SimpleW3drive.writeChunk()` calls `fileFD.writeChunkByCalldata()`. The underlying large-storage interface distinguishes `OnChain` and `Blob` modes; calldata chunk writes select the onchain/contract-bytecode path. The current user-file code therefore does **not** demonstrate scalable EthStorage-provider storage for those files, even if the frontend itself is deployed through EthStorage tooling.

### Product gaps relative to Dropbox

- flat list rather than hierarchical folders;
- no continuous desktop/mobile synchronization;
- no conflict model or merge UX;
- no collaborative document semantics;
- no file/version timeline or restore experience;
- no mature link, group, and role sharing;
- no key rotation/recovery ceremony for multi-device or lost-wallet cases;
- no search/index model;
- a wallet transaction per small upload/chunk batch and possible partial completion;
- metadata remains public even where content is encrypted;
- pointer removal does not erase immutable chain history/provider/cache copies.

The correct label is **encrypted decentralized-drive proof of concept**, not a drop-in Dropbox replacement.

### End-to-end frontend caveat

The audited `public/index.html` imports a module from `w3q-wc.s3.us-west-2.amazonaws.com`. Unless that dependency is pinned and independently verified, a conventional mutable host can alter code executing inside an otherwise web3-hosted application. This is exactly the dependency-closure failure EFS packages and verified frontend delivery must prevent.

## Social application evidence

The current [sample-application catalog](https://github.com/ethstorage/web3url-doc/blob/9301db620180487f4007c5eecb0521c159f4f3cc/tutorials/sample-applications.md) lists a blog, W3Box, W3Drive, email, music, and QRobot applications.

[dBlog](https://github.com/ethstorage/dblog) provides owner-oriented blogging and comments. It is useful source evidence for publishing and interaction through the stack. It is not a Twitter-equivalent protocol/product with portable social graphs, feeds, follows, moderation, discovery, spam control, multi-client interoperability, and operator exit.

No verified current EthStorage Twitter clone was found in this pass.

## Client-side verification

EthStorage's [client-side frontend verification](https://blog.ethstorage.io/client-side-verification-for-on-chain-frontends/) is one of the strongest parts of the current program.

The prototype's model:

1. fetch Ethereum/state evidence through an untrusted gateway;
2. use a client-side light-client/verifier path to authenticate the relevant L1 state;
3. fetch the EthStorage payload;
4. locally recompute/check its blob/KZG commitment against authenticated state;
5. reject substituted frontend bytes.

The source surfaces are at different maturity levels and should not be conflated. The standalone [`web3-url-verifier`](https://github.com/ethstorage/web3-url-verifier/tree/2da72cadb758ca8305913fec182756345ea84b7f) contains the Colibri-authenticated Ethereum-state and payload/KZG verification path. The companion [`web3-verifier-extension`](https://github.com/ethstorage/web3-verifier-extension/tree/93a730dd6e63bd9df886568a7db28c8153d41670) captures browser resources and demonstrates the extension workflow, while its own roadmap still treats the complete cryptographic-verification wiring as unfinished. Future claims must identify which verifier and execution path were actually tested.

This materially reduces integrity trust in gateways. It does not automatically provide:

- privacy from the RPC/gateway;
- availability when every serving endpoint withholds;
- verification of unpinned third-party subresources;
- safety of the verified JavaScript once executed;
- a capability sandbox for third-party applications;
- proof that the live deployment matches the published verifier source.

EFS should treat this as reusable prior art for verified response/package delivery. The EFS-specific contribution would be binding the verified bytes to portable EFS resolution evidence, complete dependency closures, content type/security headers, app capabilities, provenance, and alternate placements.

## Lessons carried into EFS

1. `web3://` compatibility is valuable but must not be described as a byte-placement or permanence guarantee.
2. FlatDirectory is a candidate storage adapter, not a substitute for portable object identity.
3. A web3-hosted entry file is insufficient if mutable conventional subresources remain outside the verified closure.
4. Encrypted bytes do not solve metadata privacy, recovery, sharing, or deletion.
5. Demonstrations should be labeled at the capability they prove; “file upload works” is not “Dropbox solved.”
6. Verified frontend delivery is existing EthStorage prior art worth integrating or co-developing.
7. The EFS guest path and optional OS should be able to use these verified resources without requiring an account or wallet for public reads.
