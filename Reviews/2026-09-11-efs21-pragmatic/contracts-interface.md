# Native experiment contract interface

**Standing:** isolated fresh-genesis filesystem-profile cost experiment; not an adopted generic EFS Core, full-v2 parity, or production deployment. Solidity 0.8.30, Cancun, optimizer 200, via-IR. Contract artifacts: `contracts/out/<Name>.sol/<Name>.json` after `forge build` inside `contracts/`.

## Deployment and exact types

1. Deploy `NativeKernel()` (the Files facade); it first deploys `NativeRecordKernel()`, which creates expanded registry, mandatory `RecordInventoryIndex`, then unchanged `BodyWriter`. The facade then creates `NavigationIndex(recordInventory)` and discovery. The facade remains the Navigation/Discovery writer; the Record kernel is the inventory/helper writer. Explicit getters are `recordKernel()`, `recordInventory()`, and the Record kernel's `bodyWriter()`; `types()` remains compatible with `ExactTypeRegistry`. These are separate runtime **and storage** accounts, not delegatecall. Required dependency code identity is pinned; new Records require the inventory's exact success marker.
2. Deploy `Uint256Validator()` and `BytesValidator()` from the unchanged `ExactTypeRegistry.sol`, plus `RawBytesValidator()` from its separate source file.
3. Call `types.register(bytes descriptor,address validator) -> bytes32 typeId`. Descriptor is an immutable opaque specification, 1–1024 bytes, recoverable with `descriptorOf(typeId)`. It is **not** a full-v2 Type grammar. Registration permits exactly these three compiled stateless runtime hashes; arbitrary custom developer programs, proxies, mutable configuration and dependency calls are not supported.

Identity formulas use ordinary ABI encoding, **not packed encoding**:

```text
TypeId   = keccak256(abi.encode(keccak256("EFS21_TYPE_V1"), keccak256(descriptor), validatorRuntimeCodeHash))
RecordId = keccak256(abi.encode(keccak256("EFS21_RECORD_V1"), TypeId, exactBodyBytes))
FileId   = keccak256(abi.encode(keccak256("EFS21_FILE_V1"), chainId, kernelAddress, nativeCaller, uint256 nonce))
```

Type and record identities exclude chain/deployment/local validator address. The validator hash is compiler/source-build-specific, including compiler metadata. Re-registering equivalent descriptor+runtime at a different validator address returns the same TypeId without replacing the original execution address. `typeInfo(id)` returns `(schemaHash,validator,codeHash)`. Every acceptance checks pinned runtime hash, then a 50,000-gas STATICCALL; exactly 32 return bytes encoding `true` are required. Only 32 return bytes are copied. Existing record dedup still validates. Missing/changed validators reject; there is no operator-controlled repair/reinterpretation.

`Uint256Validator`: body exactly `abi.encode(uint256)`, 32 bytes. `BytesValidator`: canonical `abi.encode(bytes)` (also ABI string representation), offset 32, exact padded length, zero padding. `RawBytesValidator`: body is the payload itself, including empty bytes. Neither bytes Type guarantees UTF-8. Text clients explicitly decode UTF-8 and report failures. `MAX_BODY=4096` is an experiment limit: canonical payload maximum4032, raw maximum4096. Raw is a distinct Type/Record identity, not reinterpretation. Explicit packed `present` distinguishes a present empty record from absence. See [representation evidence and the frozen-registry maintenance exception](README.md#raw-representation-checkpoint).

## Writes and point reads

The [historical always-code body-storage candidate](evidence/body-storage.md) preserves the public `Record(typeId,body)` shape and admission APIs. Internally it stores `(typeId,pointer,uint16 bodyLength)` plus explicit presence. Its pinned kernel-only helper creates exactly `STOP || body` with zero value for each new validated RecordId; duplicates allocate nothing and still run Type validation. Helper creation is after all existing constructor deployments, so their addresses and kernel CREATE nonce behavior are preserved. No public pointer/helper/initcode input or helper getter is added. Empty raw is present with a one-byte STOP object in that historical artifact. `readRecord` distinguishes `MissingRecord` from `CorruptRecord`, checks bounded length, pointer/code size/prefix, then recomputes the exact RecordId before returning bytes. These integrity costs are included in the three-arm evidence. This changes fresh-genesis private layout only; no populated-state migration is supported or implied.

Files writes authenticate native `msg.sender` at the facade; there is no author parameter, tx.origin or delegated signature surface. Pure `storeRecord` admission is permissionless and author-neutral, whether called directly on the Record kernel or forwarded through Files; it makes no authorship claim and creates no Files state. `rootId(address)` is deterministic, nonce zero; `ensureRoot()` initializes the caller's root once. Non-root files/directories use monotonically increasing `fileNonce(address)`, beginning at one.

The [subsequent packed-presence experiment](evidence/packed-presence.md) stores the explicit bool after pointer/uint16 length in the same word. The former presence mapping root remains reserved and unused to preserve later layout. False presence returns `MissingRecord` before metadata checks; clearing the bit cannot be distinguished from absence. True malformed metadata/code still returns `CorruptRecord`. Public ABI and all identity formulas remain unchanged; this is still always-code, not a hybrid or migration.

The [pre-extraction bounded hybrid experiment](evidence/hybrid-body.md) appended a private backend byte after that bool and a fixed128-word mapping at root6. The [current boundary extraction](evidence/kernel-boundary.md) retains the exact policy and metadata packing but moves metadata to root0 and words to root1 of the separate Record kernel. New admissions validate, hash/dedup, check helper identity, then select code or words from exact length and masked nonzero-word occupancy. Duplicates never relocate and create no new inventory obligation; after validation they can return even if inventory/helper code is unavailable. Every new Record must reach the pinned inventory append/marker or revert atomically. SDK-qualified operations separately require the complete current graph. Point-data reads do not depend on inventory availability.

Code retains the same inert object checks; words require zero pointer, load only the bounded authoritative range, reject tail padding, and rehash the same identity. Empty word-backed records have explicit presence with no child or body word. There is no public selector/configuration API. Unknown tags and overlong lengths refuse; cleared presence and garbage beyond the authoritative range are not claimed detectable. The helper is now the Record kernel's third child and is checked for new admissions even when words are chosen. Paid word reads can regress sharply despite cheaper writes. This is not a migration or a change to the running snapshotted browser.

| Operation | Public API |
|---|---|
| Root | `ensureRoot() -> bytes32` |
| Directory | `createDirectory(bytes32 parent,bytes name) -> bytes32` |
| File | `createFile(bytes32 parent,bytes name,bytes32 typeId,bytes body) -> bytes32` |
| Content edit | `editFile(bytes32 fileId,uint64 expectedRevision,bytes32 typeId,bytes body)` |
| Rename/move regular file | `moveFile(bytes32 fileId,uint64 expectedRevision,bytes32 parent,bytes name)` |
| Remove empty directory/file | `unlink(bytes32 fileId,uint64 expectedRevision)` |
| Admit independent immutable record | `storeRecord(bytes32 typeId,bytes body) -> bytes32` |
| File status/head | `fileInfo(bytes32) -> FileInfo(owner,directory,live,revision,recordId)` |
| Immutable 1-based history | `revisionAt(bytes32,uint64) -> Revision(recordId,parent,name,live)` |
| Exact record | `readRecord(bytes32) -> Record(typeId,body)` |
| Immediate path point | `lookup(address namespace,bytes32 parent,bytes name) -> bytes32` |
| Nested path | `resolve(address namespace,bytes[] path) -> bytes32` |

Creation is create-only; existing names reject, never overwrite. Each edit/move/unlink appends an immutable revision and increments the same per-file CAS counter. Content edits may select another exact TypeId. Even a same-content edit or same-location move creates a new revision. Child changes do not increment the parent directory's FileInfo revision; they change its listing generation instead.

One live placement per object. Directory moves/renames reject; cycles therefore cannot be created. Nonempty directory and root removal reject. Unlink is terminal, but FileInfo, every revision, old names/parents and immutable record bytes remain readable. Recreate under the same name allocates a **new FileId**. This is reduced scope, not full-v2 restore/hardlink/Lens semantics.

Names: 1–64 printable ASCII bytes (`0x20..0x7e`), excluding `/`, `.` and `..`. Case-sensitive; no Unicode normalization or case folding. Percent sequences are literal (e.g. `%2F` is not slash). Paths are pre-split names, at most 32 segments. `[]` means root. No on-chain slash parsing, dot traversal, URI decoding or mount following. Deeper trees can be navigated through repeated exact lookup; the single-call resolver is bounded. Invalid paths, non-directory intermediates and invalid parents revert; an absent name or uninitialized namespace returns zero. An empty initialized directory returns a successful empty page. Never convert an RPC/revert failure to absence/empty UI.

`FileChanged(fileId,owner,revision)` remains emitted by the Files facade. `RecordStored(recordId,typeId)` is emitted only by the Record kernel for a new Record, including facade-forwarded admission; there is no duplicate facade event. Its declaration remains in the facade ABI for compatibility, not an emitter promise. Canonical reconstruction never requires logs. Re-read the committed block after writes and verify expected state.

## One-call listing and distinct historical universes

`Cursor = (bytes32 scope,uint256 revision,uint256 offset)`. Begin with `(0,0,0)`. Continue with the **entire** returned `next`; never synthesize a cursor from an offset. Page sizes 1–64.

`kernel.listDirectory(namespace,parent,cursor,limit) -> DirectoryPage(entries,next,complete)` hydrates one coherent page of `Entry(id,FileInfo file,bytes name)` in **one external call**. It excludes bodies; call `readRecord` to open content. `navigation.directoryPage(...)` is the IDs-only primitive. Directory cursors bind index address, namespace, parent and mutation generation. Every immediate child's create/edit/rename/move/unlink invalidates old continuation, including empty/end pages. A cross-directory/namespace cursor rejects. Swap-pop order is not stable/sorted. Restart at `(0,0,0)` after staleness; don't claim merged cross-generation completeness. Cross-RPC consumers should pin block hash/number as well; one-call contract consumers see atomic state.

`navigation.fileInventory(namespace,cursor,limit)` enumerates **all created IDs**, including root, directories, and unlinked objects. `recordInventory.typeInventory(typeId,cursor,limit)` enumerates **unique records ever admitted for that exact type**, not placed files or authored occurrences; Navigation preserves its tuple-compatible forwarding API but owns no Record postings. Both are monotonic append-only arrays. Their cursors pin a high-water in `revision`, not a live mutation generation. Record cursor scope names the actual Record inventory account, so an old monolithic cursor cannot resume against the new source. Later appends do not invalidate an existing immutable prefix. File IDs in this history can hydrate to newer live/dead state unless block-pinned. Record bodies cannot change. These inventory types have distinct scope hashes; cross-universe cursors reject. Zero inventory for an unknown TypeId means no records; `typeInfo` separately establishes registration.

## Contract interoperability and cost floor

`QuoteProducer(NativeKernel,bytes32 quoteType)` creates its **own** root and `swaps` directory in construction. Only its deploying `operator` may call `publish(uint256 value,uint64 expectedRevision)`; first expected revision is zero, later calls use current file revision. `quoteFile()` remains stable. Namespace publisher is the producer contract, not its operator EOA.

`QuoteReader.read(kernel,publisher,expectedType) -> (uint256 value,bytes32 fileId,uint64 revision)` resolves `swaps/eth-usdc`, checks live regular-file state and exact type, then reads/decodes canonical bytes. It never reads producer-local quote values.

`PlainQuoteMapping.set(bytes32 key,uint256 value)` / `values(key)` is an operator-only ordinary storage cost floor. It deliberately lacks file identity, types, retained history, paths, enumeration, and existence distinction. **Not semantic parity.**

## Verification and limitations

Run `forge test -v`, `forge test --match-contract GasOperationsTest --gas-report`, and `forge build --sizes` from `contracts/`. Named gas operations are reproducible Forge execution measurements, not transaction receipts or final network fees. Task 2 must measure fresh-world receipts and cold/steady costs separately; see `contracts/evidence/`.

The separate discovery contract additionally supports one namespace-owner-selected exact uint256 equality profile, required/tolerated maintenance policy, bounded late backfill and qualified coverage. Its universe is current linked regular files, not full-v2 occurrences; [discovery evidence](evidence/discovery.md) defines the boundary. It is not yet exposed as browser search/tag controls.

No upgrades/populated-state migration, portable envelopes/Principals, independently detachable authorship, plural Lenses, generic bindings/occurrences, mandatory full-v2 graph/backlink/equality indexes, relational tags, arbitrary validator programming, restoration, multi-placement, directory moves, chunking, external carriers, Unicode names, gas sponsorship or access delegation. Names and historic bytes are public and permanent in this experiment. Three supplied reviewed validator runtimes are a material Type-system restriction; separate-storage native Files costs must not be sold as unchanged full-v2 costs.
