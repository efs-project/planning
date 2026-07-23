# EFS v2 — Cross-platform read-only mounted filesystem semantics

**Status:** draft implementation/profile design around an adopted product requirement — not a full POSIX or Win32 compatibility promise
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[fs-pass-synthesis]], [[codex-kinds]], [[read-lens-spec]], [[assumptions-and-requirements]], [persistence and sync](../clientv2/persistence-and-sync.md)
**Related research:** [[ethereum-first-efs-and-os]]
**Supersedes:** —
**Reviewers:** @cross-platform-mounts, @efs-architecture-audit, @metadata-mapping (2026-07-22 gap audit)
**Last touched:** 2026-07-22

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client

> **Owner requirement, adopted 2026-07-22:** EFS v2 must expose a useful read-only mounted filesystem on Linux, macOS, and Windows. Linux FUSE is one adapter and the likely first implementation path, not the canonical EFS API and not the whole requirement. The exact adapters, packaging, and metadata projections remain research/design choices. Writable mounts remain a later possibility.

## Executive judgment

**A useful cross-platform EFS mount appears feasible. A truthful general-purpose EFS mount is not merely a storage adapter.** Directories, regular files, stable object identity, deterministic enumeration, random-access reads, and bounded metadata form a portable read-only core. Linux, macOS, and Windows can each project that core through a user-space filesystem adapter. A writable local-first mount still looks plausible, but is not part of the adopted requirement.

### Primary validation target

The required target is deliberately narrower than full filesystem compatibility:

> **Mount the same read-only EFS view sourced from the selected Ethereum/EVM venue—potentially an L2 such as Base or Arbitrum—on Linux, macOS, and Windows, then browse folders and open/copy files with each platform's ordinary command-line tools and graphical file manager.**

This target does not require writable mounts, signing, a local pending overlay, cross-chain composition, or full POSIX/Win32 compatibility. Non-EVM substrate support is a separate research track, not a later phase of this mount project. The read-only Ethereum/EVM mount is valuable on its own because it would:

- validate that EFS path lookup and folder enumeration produce a deterministic tree;
- validate that the on-chain point-read and completeness indexes are sufficient for filesystem traversal;
- exercise lenses, shadowing, links, redirects, content commitments, and byte retrieval through ordinary operating-system calls;
- make large public EFS datasets immediately useful to ordinary tools that know nothing about blockchains; and
- expose missing filesystem semantics before the record and read surfaces freeze.

A successful milestone needs only path lookup, attributes, directory enumeration, open/range-read, stable file identity, and honest errors. Symlinks are optional for the minimum portable profile. Unix adapters should mount `ro,noexec,nosuid,nodev,noatime`; Windows should expose the equivalent read-only/non-executable posture that its adapter permits. There is no key or wallet requirement for normal reads.

The metaphor needs one correction:

> **A chain is not a hard drive. A chain is one possible authenticated evidence, admission, authority, and query venue. The “drive” users mount is a resolved projection of evidence under a lens and a read basis, with a local journal layered on top.**

In compact form:

```text
read-only mounted tree = resolve(evidence set, lens policy, basis, limits)
future writable view   = read-only mounted tree + local pending overlay
```

The primary mount reads from an Ethereum/EVM EFS profile, its declared byte sources, and optional verified local caches/exports. Those sources do not automatically supply identical authority, completeness, freshness, or retention guarantees. This document concerns their projection into host filesystems; it does not evaluate another chain as an EFS substrate.

The key result is reassuring: **the core does not crack because it uses files and tags.** The stress concentrates at a finite semantic boundary:

- graph-to-tree projection;
- lens-relative names and absence;
- immutable evidence versus mutable file handles;
- POSIX, macOS, and Win32 namespace/metadata expectations;
- key/user/capability mediation;
- inode, cache, time, and lifecycle synthesis; and
- honest exposure of incomplete or stale remote state.

Those are serious engineering problems, but they belong mostly in an explicit **EFS filesystem profile and mount daemon**, not in a universal storage abstraction and not necessarily in the Etched record kernel.

## 1. The thought, made concrete

“Mount Alice,” “mount Ethereum,” and “mount this local EFS archive” are three different choices that the original metaphor compresses:

1. **Who or what am I reading through?** A lens may select one author, several authors, a curator policy, denials, unions, and path-scoped rules.
2. **Which evidence is available?** A mount may combine Ethereum/EVM admissions, several RPC/proof/index sources, a complete local export, cached records, and one or more byte stores.
3. **At what basis and grade?** A view may be pinned to a block/checkpoint, follow a live venue, or be incomplete and unable to prove absence.
4. **Who may create local intents and signatures?** The Unix process, mounted user, EFS principal, current actor key, relayer, and fee payer are different identities.
5. **Where do new bytes become durable?** Local journal durability, exported bundle durability, submitted-chain state, finalized-chain state, and replicated bytes are distinct milestones.

A mount should therefore be described by something like:

```ts
interface EfsMountDescriptor {
  root: EfsRootSelector;
  lens: LensPolicyRef;
  evidenceSources: EvidenceSource[];
  byteSources: ByteSource[];
  basis: 'PINNED' | 'FOLLOW' | VenueBasisVector;
  completenessPolicy: 'REQUIRE_PROVEN' | 'ALLOW_GRADED';
  writeActor?: ActorRef;
  journal?: LocalJournalRef;
  publishPolicy?: 'LOCAL_ONLY' | 'EXPLICIT' | PublishProfile;
  cachePolicy: CachePolicy;
}
```

That descriptor is conceptual, not an API proposal. Its purpose is to prevent one overloaded string such as `efs://alice@ethereum/` from silently deciding trust, time, keys, and publication.

### Source-composition invariant

Artifacts fetched from several sources may be deduplicated by their canonical logical ID and exact signed bytes. Their **receipts and guarantees do not merge upward**. Authority, freshness, finality, proof strength, retention, and completeness remain qualified by source, realm/authority domain, and basis.

In particular:

- a replica can supply missing evidence without turning it into authoritative admission;
- one source's receipt cannot upgrade another source's observation;
- contradictory exact bytes or receipts remain visible evidence, not an implementation detail to collapse;
- source duplication does not count as independent authority or availability unless the trust model says why; and
- absence is conclusive only from a closure proof, complete manifest, or complete enumeration for every relevant authority domain in the mounted policy.

This rule prevents a partial RPC response, local cache, or hosted index from making an Ethereum-domain absence look proven.

### A mount per user is the simple subset

A single-author lens can feel very much like a conventional home directory:

```text
/mnt/efs/alice/...
```

That is an excellent baseline. The full EFS lens model is broader. A lens that says “Alice for `/work`, this curator group for `/software`, my own overlay first, and deny this actor” behaves more like a versioned union/overlay filesystem than a mount for one user.

So the accurate statement is:

> **A user mount is one useful lens. A general lens is a policy-defined namespace projection that may combine many principals.**

## 2. What maps cleanly

| Filesystem idea | EFS mapping | Judgment |
|---|---|---|
| File bytes | DATA identity plus a content commitment and verified byte source | clean, provided identity and content version stay distinct |
| Directory | TAGDEF structural namespace node; children derive from TAGDEF ancestry plus filesystem-profile projection rules | clean as a projected tree |
| Name | canonical TAGDEF segment; display name remains metadata | clean with EFS's stricter Unicode grammar |
| Folder membership | lens-selected placement claims; LIST is a directory only under an explicit list-as-directory profile | clean once the profile names the projection |
| Extended metadata | namespaced VAL/TAG edges | natural mapping for bounded point metadata |
| Version history | append-only claims, supersession, checkpoints | can provide richer immutable evidence when history is complete and basis-qualified |
| Shared object identity | several placements can expose the same DATA/content identity | clean in EFS metadata; native hard-link/inode behavior is optional because it is not portable to the Windows adapter |
| Symbolic link | reserved `symlink` edge with bounded follow rules | workable within a declared filesystem profile |
| Union/overlay | a filesystem-profile `PRIORITY_FIRST_PRESENT` authority rule plus explicit WHITEOUT masking | natural for that combiner, not for every typed lens |
| Snapshot | basis plus lens/view parameters | promising, contingent on canonical lens encoding and basis-manifest rules |
| Offline writes | local append-only journal and materialized pending tree | already present in the client design |
| Watch | venue-spine polling plus local journal notifications | workable, not global push |
| Export/import | exact signed records plus manifests/bundles | a strong portability path |

This is enough to justify a real prototype. FUSE exists precisely to let an ordinary userspace daemon provide data and metadata through the kernel filesystem interface, including unprivileged mounts. ([Linux FUSE overview](https://docs.kernel.org/filesystems/fuse/fuse.html))

## 3. The EFS-specific inventions that create impedance

### 3.1 A graph is not automatically a tree

EFS can express multiple parents, backlinks, arbitrary tags, redirects, and cycles. A normal filesystem presents a rooted namespace with directory traversal rules. The mount therefore cannot expose “the graph” directly; it must expose a deterministic tree projection and make non-tree relations inspectable through metadata, queries, or a control namespace.

Required profile rules include:

- one declared root;
- which edge kinds create directory children;
- deterministic collision/shadowing behavior;
- bounded redirect and symlink traversal;
- cycle detection;
- whether a multiply placed object is several view entries or an optional host hard link; and
- how graph-only edges are surfaced without inventing filenames for all of them.

This is an adapter obligation, but ambiguity in those rules would fork filesystem behavior across implementations.

### 3.2 Lenses make the namespace viewer-relative

The old shorthand “which user are you reading?” is useful but incomplete. Under EFS, `/readme` can resolve to the first acceptable source under a lens, not to one globally mutable directory entry. Changing the lens, deny set, evidence set, or basis can change the winning inode at the same path.

That has three consequences:

1. caches must be keyed by the view identity and basis, not merely by path;
2. open handles should remain pinned to the resolved object/version they opened, even if a later lookup resolves differently; and
3. a writable mount needs a named **upper author/actor**—reading through ten authors does not answer whose signed placement a new file should become.

The closest Unix analogy is an overlay/union mount with provenance, snapshots, and a user-selected upper layer. It is not a conventional shared mutable volume.

Host kernel/adapter entry, attribute, and data caches add another view boundary. A live mount needs bounded TTLs and explicit invalidation or remount/refresh rules when a followed basis changes or a winner is revoked/superseded. Daemon-side cache isolation alone is not sufficient.

#### Plan 9 is the clearest precedent, not an exact specification

The analogy is real. Plan 9 makes each process's namespace a first-class object and lets `bind`/`mount` place file trees before, after, or instead of existing trees. A union directory is searched in order; if a walk misses in the first member, Plan 9 tries the next. ([The Use of Name Spaces in Plan 9](https://9p.io/sys/doc/names.html), [`bind(2)`](https://9p.io/magic/man2html/2/bind)) That is very close to a simple EFS `PRIORITY_FIRST_PRESENT` lens.

But a full EFS lens is more than a Plan 9 namespace:

- Plan 9 composes file servers and pathname trees; EFS evaluates signed claims, author/principal policy, typed scopes, denials, grades, provenance, and an explicit evidence basis.
- A Plan 9 miss from an available union member permits search to continue. Union-directory reads concatenate members in order rather than recursively merging and deduplicating them like OverlayFS, and Plan 9 has no native EFS-style whiteout. An EFS projection instead enumerates one resolved winner per visible name, and an EFS `UNKNOWN` at a higher-priority source must stop ordinary resolution; it cannot safely become a miss.
- Plan 9's `qid`/version and namespace order help model stable file identity and precedence, but do not supply EFS signature, authority, finality, or completeness rules.
- EFS metadata and graph relations exceed 9P2000's basic file metadata, so a lossless control/API surface is still needed.

EFS could work well on Plan 9 by running an EFS resolver as a 9P file server and mounting its resolved tree. The clean design is usually to resolve the full EFS lens inside that server; Plan 9 namespaces can then compose whole EFS roots or intentionally simple author layers. Porting an Ethereum RPC, proof, hashing, signature, and content-fetch stack to Plan 9/9front would be real implementation work, so Plan 9 is a semantic reference and possible later adapter—not part of the adopted three-platform requirement.

Linux has pieces of the same idea, but not one exact equivalent:

- mount namespaces give processes/groups distinct mount hierarchies;
- bind mounts alias a subtree elsewhere;
- OverlayFS supplies ordered upper/lower precedence, merged directories, and whiteouts; and
- FUSE is where EFS can implement its exact typed lens, `UNKNOWN`, basis, and provenance behavior.

Linux mount namespaces therefore validate viewer-relative namespace isolation, while OverlayFS provides a strong comparison for the priority/whiteout subset. ([Linux mount namespaces](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html), [OverlayFS](https://docs.kernel.org/filesystems/overlayfs.html)) Neither replaces the EFS lens resolver.

### 3.3 Path-derived TAGDEF identity makes directory rename special

If a folder node's logical identity derives from its path lineage, moving the node cannot be modeled solely as mutating a parent/name field. [[fs-pass-synthesis]] currently uses a `movedTo` redirect so descendants keep their existing tag identities.

That preserves references and history, but it is not automatically the same as POSIX `rename()`. Linux expects replacement at the destination to be atomic, supports `NOREPLACE` and atomic exchange variants, and keeps already-open file references useful. ([`rename(2)`](https://man7.org/linux/man-pages/man2/rename.2.html), [libfuse rename contract](https://libfuse.github.io/doxygen/structfuse__lowlevel__ops.html))

The filesystem profile must decide:

- whether the old path becomes a visible breadcrumb, an internal redirect, or immediately disappears;
- whether destination replacement, source masking, and redirect creation are one atomic local transaction/envelope;
- whether `RENAME_EXCHANGE` is supported or rejected;
- whether moving a subtree preserves its logical directory identity everywhere; and
- how stale readers at the old basis behave.

This is one of the strongest pressure points against the current path-derived namespace design. It does not yet falsify it, but it needs vectors before being called “native rename.”

### 3.4 Immutable evidence meets mutable file handles

Applications routinely perform random writes, truncate, append, memory-map, rewrite temporary files, and call `fsync`. EFS records and committed content are immutable facts. The bridge is a mutable local staging object:

```text
open committed version
        ↓
copy-on-write local staging inode
        ↓ write / truncate / mmap
local journal checkpoint
        ↓
new immutable content commitment + signed placement/version intent
        ↓ optional explicit publication
venue admission / finality / replication
```

No wallet should sign each `write(2)`. Editors often produce a storm of temporary files and renames; publishing each syscall would be expensive, privacy-leaking, and semantically wrong. The daemon should coalesce a local filesystem transaction into one or more canonical EFS intents, and it needs a clear ceremony before signing or public submission.

This also means `close()` cannot be the only commit boundary. Libfuse notes that `release` errors are not returned to the `close()` or `munmap()` that triggered release, while `flush` can run more than once and applications may ignore close errors. ([high-level libfuse operations](https://libfuse.github.io/doxygen/structfuse__operations.html), [low-level libfuse operations](https://libfuse.github.io/doxygen/structfuse__lowlevel__ops.html)) The durable protocol action needs an explicit journal/checkpoint path, with `fsync` assigned a narrow honest meaning.

### 3.5 EFS absence can be UNKNOWN; POSIX lookup wants an answer

This may be the deepest semantic crack.

`ENOENT`—the term James heard as “ENDENT”—is the standard Unix error meaning **No such file or directory**. It normally says the path, a path component, or a symlink target does not exist in the namespace the filesystem actually consulted. ([`errno(3)`](https://man7.org/linux/man-pages/man3/errno.3.html)) macOS uses the same errno; Windows adapters translate proven absence to native file/path-not-found results.

`UNKNOWN` is not a POSIX or Windows error. It is an EFS resolver result meaning **the available evidence is insufficient to prove either presence or absence at the requested lens and basis**. Examples include an unavailable RPC, a missing directory page, an unchecked higher-priority principal, an unproved current basis, or an incomplete snapshot. If a higher-priority lens source is unknown, falling through to a lower source can produce the wrong file.

The portable resolver contract should be explicit:

```ts
type LookupResult =
  | { kind: 'PRESENT'; entry: ResolvedEntry }
  | { kind: 'ABSENT_PROVEN'; basis: ProvenBasis }
  | { kind: 'UNKNOWN'; reason: UnknownReason; retryable: boolean };
```

Only `ABSENT_PROVEN` maps to `ENOENT`/native not-found. `UNKNOWN` maps to a cause-appropriate transient or I/O failure (`EAGAIN`, `ETIMEDOUT`, `EHOSTUNREACH`, or `EIO` on Unix; an explicit corresponding Windows failure), and diagnostics preserve the EFS reason. It must never populate a negative lookup cache as if absence were proved.

The mount must never flatten `UNKNOWN` into “not found.” Candidate behavior:

| EFS result | Filesystem behavior |
|---|---|
| winner proven at pinned basis | return entry |
| absence proven for the complete mounted view/basis | `ENOENT` |
| bytes authenticated but unavailable | `EIO` or `ENODATA`, plus diagnostic metadata |
| source/currentness incomplete | retry/fail such as `EAGAIN`, `EHOSTUNREACH`, or `EIO`; never silent fallback |
| explicitly permissive research mount | expose provisional alternatives only in a distinct control/alternate namespace, never as an ordinary replacement file |

Ordinary applications do not understand read grades. A metadata label cannot make a provisional lower winner safe if the application never inspects it. That makes a general “allow graded” mount inherently lossy and argues for two initial profiles:

- a **strict mount**, where uncertain lookup fails; and
- a **snapshot mount**, whose manifest/basis makes the namespace complete enough to return ordinary filesystem answers.

### 3.6 “Users are keys” is too small for a mount daemon

A signature proves that a key signed exact bytes. It does not prove that:

- the key is still authorized for a stable principal;
- the record was admitted while that authorization was current;
- the mounted view is current or complete;
- the storage provider returned the newest checkpoint; or
- the calling Unix process was authorized to request a signature.

The durable model remains:

```text
stable EFS principal
    authorizes
scoped, replaceable actor key
    signs
immutable record/evidence
```

The mount daemon then has a separate local duty: map process credentials and OS capabilities to allowed actions on this mount. An Ethereum address should not become a Unix UID as protocol truth. A fee payer, relayer, storage credential, mount owner, and record author must remain distinct.

The daemon should broker signing and never expose private keys as file contents or silently treat every program with write access as having unlimited public publishing authority.

### 3.7 Portable names need an explicit projection profile

Canonical EFS names must not be silently rewritten to whatever one host accepts. Linux pathname components are byte-oriented except for `/` and NUL; macOS applications and filesystems have Unicode normalization and case-behavior wrinkles; Windows uses UTF-16 and Win32 reserves characters, device names such as `CON`/`NUL`, and trailing spaces/dots. Windows Explorer and other shell applications may reject names that a lower-level filesystem API could technically represent. ([Windows file naming rules](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file), [Apple file-system guidance](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/FileSystemProgrammingGuide/AccessingFilesandDirectories/AccessingFilesandDirectories.html))

The mount profile therefore needs:

1. a canonical EFS name grammar and comparison rule independent of host behavior;
2. a reversible display-name escape for names a host shell cannot represent;
3. deterministic disambiguation for case or normalization collisions;
4. metadata exposing the exact canonical name and logical ID; and
5. golden vectors proving that the same EFS directory produces a stable, non-aliasing tree on all three hosts.

The portable read-only requirement does **not** justify shrinking canonical EFS identity to the Windows lowest common denominator. Host escaping is a view concern. A future writable adapter must reject ambiguous host-created names or map them through an explicit reversible creation rule; it must never publish an accidental host-normalized identity.

## 4. Cross-platform read-only mount contract

The canonical boundary should be a platform-neutral resolved-filesystem core, not the Linux FUSE callback ABI:

```text
mount(root, lens/policy revision, realm + code basis, finalized evidence basis,
      evaluation time, completeness policy)
lookup(parent, presented name) -> PRESENT | ABSENT_PROVEN | UNKNOWN
open_dir(entry) -> pinned directory handle
read_dir(handle, cursor) -> deterministic page
get_attributes(entry)
open_file(entry) -> pinned file handle
read(handle, offset, length) -> verified bytes
list_metadata(entry) / get_metadata(entry, key)
close(handle)
```

Directories and regular files are mandatory. Safe relative symlinks may be supported after identical bounded-follow tests pass. Native hard-link behavior is **not** in the smallest common contract: WinFsp does not currently support hard links, so two placements can have distinct host entry IDs while exposing their shared EFS DATA/content identity through metadata. ([WinFsp NTFS compatibility](https://winfsp.dev/doc/NTFS-Compatibility/)) All mutating operations—including create, write, truncate, rename, unlink, mode/ACL/timestamp changes, xattr/EA/stream writes, and local tombstones—must fail read-only.

### Candidate adapters

| Host | Leading adapter | Why | Product caveat |
|---|---|---|---|
| Linux | libfuse3 | reference userspace filesystem interface; needed read callbacks and unprivileged mounts are established | mount ownership, `allow_other`, daemon lifecycle, timeouts, and distribution packaging still need testing ([Linux FUSE](https://docs.kernel.org/filesystems/fuse/fuse.html)) |
| macOS | macFUSE/libfuse3 initially; evaluate native FSKit | current macFUSE ships libfuse2/3 and an FSKit backend; shared core is plausible | legacy backend approval/reboot friction, current FSKit limitations/version floor, signing/notarization, and macFUSE redistribution licensing are product work ([macFUSE](https://macfuse.github.io/), [macFUSE backends](https://github.com/macfuse/macfuse/wiki/FUSE-Backends), [license](https://raw.githubusercontent.com/macfuse/macfuse/master/LICENSE.txt), [FSKit](https://developer.apple.com/documentation/fskit)) |
| Windows | WinFsp, with native API available if needed | mature userspace filesystems, drive/directory mounts, Explorer integration, FUSE compatibility, EAs/streams/reparse support | UTF-16, Windows security descriptors, deletion/reparse semantics, runtime installation, signing, and licensing differ from POSIX ([WinFsp docs](https://winfsp.dev/doc/), [native API versus FUSE](https://winfsp.dev/doc/Native-API-vs-FUSE/)) |

Microsoft ProjFS is useful prior art and may become a cached Explorer integration, but it is not the leading conformance adapter. It projects into an existing local directory, merges projected and local state, is an optional Windows component, and is designed for high-speed backing stores without online/offline progress semantics. Those choices make a strictly immutable remote view less clean than a dedicated WinFsp filesystem. ([ProjFS overview](https://learn.microsoft.com/en-us/windows/win32/projfs/projected-file-system), [ProjFS enumeration](https://learn.microsoft.com/en-us/windows/win32/projfs/enumerating-files-and-directories))

One high-level FUSE3 adapter might share substantial glue across libfuse3, macFUSE, and WinFsp-FUSE. That is an implementation experiment, not an assumption. WinFsp itself documents material POSIX/Windows differences—alternate streams, security descriptors, reparse points, deletion, and UTF-8/UTF-16 conversion. Passing on Linux is therefore the start of cross-platform validation, not proof that the other two are trivial.

### Operation mapping

FUSE makes the pressure test concrete because a useful implementation must answer operations such as `lookup`, `getattr`, `readdir`, `open`, `read`, `write`, `unlink`, `rename`, `link`, `fsync`, locks, and extended attributes. ([libfuse operation surface](https://libfuse.github.io/doxygen/structfuse__operations.html)) The shared core supplies the EFS result; each adapter translates it to its native call and error vocabulary.

| Operation | Proposed EFS behavior | Main caveat |
|---|---|---|
| `lookup(path)` | resolve canonical path under mount lens and pinned/current basis | `UNKNOWN` is not `ENOENT`; cache key includes view+basis |
| `getattr/stat` | synthesize regular file/dir/symlink metadata; expose logical identity and grade separately | EFS has no native POSIX uid/gid/mode/atime |
| `opendir/readdir` | snapshot the resolved directory at `opendir`; paginate with stable continuation | mutations and incomplete evidence cannot cause skipped/duplicated entries |
| `open/read` | pin selected logical object, content commitment, lens, and basis in file handle; fetch and verify bytes | path may resolve differently after open; byte availability is separate |
| `create/mkdir` | return read-only | future profile may stage a local DATA/TAGDEF/placement intent; host-created-name rules remain open |
| `write/truncate/writable mmap` | return read-only | future profile may mutate local staging bytes and later commit a new immutable version |
| `flush` | no dirty data; return the adapter's normal success/no-op result | future writable flush is not publication or finality |
| `fsync/fsyncdir` | no dirty data; return the adapter's normal success/no-op result | future writable meaning is local crash durability, never implied chain finality |
| `rename` | return read-only | future same-author atomic journal recipe and `movedTo` behavior remain unresolved |
| `unlink/rmdir` | return read-only | future operation can hide/revoke a placement but cannot promise public-history erasure |
| `link` | return read-only | future native hard links are optional; shared EFS identity stays visible in metadata |
| `symlink/readlink` | reserved link edge with bounded/cycle-safe resolution | external URLs and cross-realm references are not ordinary local path strings |
| `get/listxattr` or native EA equivalent | expose a curated, complete bounded `user.efs.*` projection | arbitrary graph/property enumeration is larger than xattrs; incomplete evidence is not “attribute absent” |
| `setxattr`/EA/stream write | return read-only in the required profile | future EFS property writes need explicit author/slot/signing semantics |
| `chmod/chown/ACL/time updates` | synthesize read attributes; reject every mutation as read-only | never claim host metadata changes global EFS authority |
| locks | local advisory locks only | no cross-device or cross-venue exclusion guarantee |
| watch/poll | local journal events immediately; remote venue-spine polling/invalidation | eventual and venue-relative, not global inotify |
| `statfs` | report local staging/cache capacity separately; remote quota/cost via EFS metadata | chain rent/gas and append-only history are not free disk blocks |

Two details deserve special treatment.

### Stable directory enumeration

Libfuse directory offsets are continuation cookies, not necessarily numeric array indexes; an implementation must not let concurrent mutation make unrelated entries disappear or repeat during a walk. ([low-level `readdir`](https://libfuse.github.io/doxygen/structfuse__lowlevel__ops.html)) The natural EFS design is:

1. `opendir` pins a view identity and basis;
2. the daemon materializes or streams a deterministic sorted directory snapshot;
3. offsets refer to that snapshot's continuation state; and
4. changes become visible on a new directory handle or after explicit refresh.

This appears to align with EFS basis records, contingent on canonical lens encoding and basis-manifest rules. It also makes mandatory directory completeness and pagination a filesystem correctness issue, not merely a query-performance feature.

Windows directory enumeration uses name markers and Windows ordering, while FUSE uses continuation offsets/cookies. The core therefore returns a pinned logical snapshot; the adapter may materialize and sort it in native order. Lookup and enumeration must still agree on canonical identity, and a platform's ordering must never merge, omit, or alias case/normalization collisions.

### Honest `fsync` in a future writable profile

The required read-only profile has no dirty state to synchronize. The following is retained because it is a useful design pressure test for the optional writable track.

On Linux, `fsync()` conventionally blocks until modified data and required metadata are on permanent storage; the containing directory may need a separate `fsync`. ([`fsync(2)`](https://man7.org/linux/man-pages/man2/fsync.2.html)) “Permanent” cannot honestly mean “Ethereum finalized and replicated” for every application save.

Recommended research default:

> **`fsync` means crash-durable in the local encrypted journal and byte store. Public signing, submission, finality, and replication remain explicit ladder states available through EFS controls and native UI.**

A specialized mount may offer `fsync=venue-finalized`, but it should be opt-in, slow, failure-prone, and precise about which venue and finality rule it awaits.

## 5. Synthetic inode and metadata policy

Unix exposes per-filesystem inode numbers, link counts, uid/gid, modes, size, and timestamps. Inode numbers are unique only within a filesystem, and hard links share the inode. ([`inode(7)`](https://man7.org/linux/man-pages/man7/inode.7.html)) EFS logical IDs are wider and carry different meaning.

A safe mount policy would:

- map each resolved object/version key to a persistent mount-local 64-bit inode through a collision-checked table—never truncate a 256-bit hash and assume uniqueness;
- keep a file handle pinned to logical ID plus selected content/version and basis;
- expose shared DATA/content identity independently from host file identity; an adapter may share inode/file identity only when its host supports hard links and the profile explicitly enables them;
- synthesize owner/group from the mounting context, not the EFS author;
- default untrusted, live, graded, and incomplete mounts to `nosuid,nodev,noatime,noexec`, matching EFS's lack of device files, setuid authority, and read-side atime while preventing host execution from bypassing the OS package boundary;
- derive size from the verified selected content version;
- expose capability-gated, redacted EFS author, principal, logical ID, content commitment, lens, grade, venue, basis, and pending state outside `stat`; and
- document a synthetic timestamp mapping without ever using `mtime` to choose a lens winner.

Execution requires a separate verified-closure profile that pins exact bytes, package identity, dependencies, basis, and trust policy. Projected mode metadata alone never grants executable authority.

### EFS properties as xattrs/EAs

James's intuition is directionally right:

> **EFS properties are filesystem metadata, and a resolved public scalar property should be conveniently readable through host extended-metadata APIs. But xattrs are a projection of EFS properties, not the canonical EFS property model.**

The distinction matters because EFS properties can be Unicode-keyed, multi-valued, lens-resolved graph claims with authors, losing candidates, provenance, grades, and a basis. Host xattrs/EAs are flat name-to-opaque-bytes maps with much tighter and incompatible limits. Linux requires qualified names such as `user.*` and caps names/values/listing; macOS uses shorter UTF-8 names; Windows native EA names are restricted ASCII and cap the aggregate EA set. Extended attributes are not part of POSIX and can be dropped when a file is copied through a metadata-poor filesystem. ([Linux `xattr(7)`](https://man7.org/linux/man-pages/man7/xattr.7.html), [Apple XNU xattr definitions](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/sys/xattr.h), [Windows EA semantics](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-fscc/0eb94f48-6aac-41df-a878-79f4dcfd8989))

The portable metadata contract should have two layers:

1. **Bounded convenience projection:** the same short lowercase `user.efs.*` names through Linux/macOS xattrs and Windows EAs. Fixed public diagnostics map directly. Selected public cardinality-one properties may use `user.efs.prop.<digest>`, whose canonical value envelope carries the original key, value, author/claim provenance, grade, and basis. Arbitrary Unicode property keys must not be copied directly into host attribute names.
2. **Lossless paged interface:** a versioned mount-control view plus SDK/daemon API carries every property key/value, author, claim ID, candidate, grade, basis, and continuation cursor. No semantic correctness, signature verification, or archival round-trip may depend on xattrs surviving a copy.

Candidate fixed attributes:

```text
user.efs.id
user.efs.content-commitment
user.efs.author-principal
user.efs.basis
user.efs.grade
user.efs.metadata-ref
user.efs.properties
```

`user.efs.properties` is a bounded canonical summary plus overflow/reference marker, not an excuse to squeeze an unbounded graph into one value. `listxattr`/EA enumeration must never silently truncate. If property enumeration is incomplete, the adapter returns an I/O/retry failure rather than pretending an attribute is absent. This creates a second exact-enumeration pressure test, parallel to `readdir`: the reader design must either completely enumerate resolved point-property keys at a pinned basis or explicitly classify arbitrary properties as control/API-only.

A read-only virtual control directory may be more portable than xattrs for rich structured data. EFS currently appears able to contain a real `.efs` entry, so `/.efs/` is unsafe without a reservation/escape rule. If the canonical grammar continues to reject leading `~`, a presented `~efs` control entry is a promising collision-free candidate; it remains a profile decision with golden vectors, not a protocol fact. Do not inject `foo.efs.json` siblings into the user's tree.

Windows alternate data streams are optional byte-stream UX, not the xattr equivalent or a portable contract; never name one `$EFS`, which Windows already uses for Encrypting File System internals. The Windows Property System/Explorer UI and macOS Finder/Spotlight are likewise optional typed UX/search projections, not canonical EFS storage. ([Windows file streams](https://learn.microsoft.com/en-us/windows/win32/fileio/file-streams), [Windows property handlers](https://learn.microsoft.com/en-us/windows/win32/properties/building-property-handlers-property-handlers))

All extended metadata in this milestone is read-only. A future `setxattr` cannot automatically mean “write an EFS property”: it lacks a chosen author, lens/slot conflict rule, signature ceremony, and an unambiguous meaning when another author currently wins.

Both xattrs/EAs and control files must obey the calling process's capability. Ordinary processes, Finder/Spotlight, Explorer/Search, backup tools, and cloud sync should not automatically learn a private lens graph, deny list, hidden principals, provider topology, pending-publication details, or correlatable private IDs. Attribute names can leak even when values are protected, so private metadata is hidden by default and property-key projections use digests.

## 6. Deletion, links, and garbage collection

POSIX `unlink()` removes a name and may release storage after the last hard link and open file descriptor disappear. ([`unlink(2)`](https://man7.org/linux/man-pages/man2/unlink.2.html)) EFS deliberately preserves public evidence and treats deletion as revoking or masking a placement.

This yields an unavoidable compatibility statement:

- `unlink` can make a name disappear from the writable mounted view;
- existing open handles can continue reading their pinned content;
- the record and publicly replicated bytes may remain retrievable forever;
- native link counts are adapter-synthetic and must not be treated as an EFS reference count; shared DATA/content identity is reported through EFS metadata; and
- “free disk space” cannot imply that public history was destroyed.

Private encrypted material is different: deleting all local ciphertext or destroying its keys can provide local deletion/crypto-shred behavior. The mount must not make that local outcome a claim about remote copies.

## 7. Architecture sketch

```text
Linux libfuse3     macOS macFUSE/FSKit     Windows WinFsp
       \                    |                    /
        \       thin host adapters             /
         └──────────────┬──────────────────────┘
                        ▼
                 platform-neutral efsd core
                   ├── mount descriptor + filesystem-profile rules
                   ├── lens resolver + basis/completeness engine
                   ├── materialized tree + file-ID/dir-snapshot tables
                   ├── verified range reader + byte cache
                   └── capability-gated metadata/control API
                                │
                                ├── Ethereum authority/evidence/query adapter
                                ├── local SQLite / bundle adapter
                                ├── S3-like or user-hosted replica adapter
                                └── IPFS / Arweave / other byte adapters

Optional later: 9P read-only server over the same resolved core
```

The daemon is not merely a remote filesystem client. It is the boundary that translates between:

- host filesystem APIs' synchronous, process-oriented model; and
- EFS's immutable, signed, lens-relative, venue-graded model.

Every userspace adapter introduces its own threat and lifecycle boundary. The daemon can observe request timing, can stall callers if a network source hangs, and must avoid deadlocks and unbounded graph expansion. The Linux documentation explicitly treats a dead or network-blocked daemon as a condition that may require aborting the FUSE connection. ([FUSE connection and abort behavior](https://docs.kernel.org/filesystems/fuse/fuse.html)) All adapters therefore need bounded work, deadlines, cancellation, offline behavior, crash-safe unmount/abort behavior, and a strict rule that the daemon never stores its own cache or control state inside the mount it is servicing.

## 8. Ethereum/EVM mount sources

The daemon may consume several sources within the Ethereum/EVM mount without pretending they are equivalent:

| Source/profile | Good mounted role | What the mount must not imply |
|---|---|---|
| Candidate Ethereum EFS authority profile | intended rich public evidence, current-authority, required-query, and contract-composability profile if N1/E1 select it | instant writes, privacy, or globally linear cross-chain time |
| Additional Ethereum RPC/proof/index source | redundancy, discovery, and stronger verification when its proof profile earns it | completeness, independence, or authority merely because two endpoints agree |
| Local SQLite/files | cache and fast reads; a complete read-only snapshot only with a closure manifest | public consensus, remote freshness, or new authority |
| S3-like/user-hosted store | verified bytes, bundles, declared indexes, and sync under named retention/repair policies | author identity, permissionless admission, or independently proven newest state |
| IPFS/Arweave/CAS | content integrity and/or durable byte availability under a named retention model | authority, complete enumeration, or current lens state |

“Mount a chain” can remain excellent product language if the details say what is actually mounted:

- `Ethereum — finalized public view`;
- `Alice — personal lens, following Ethereum basis`;
- `Offline snapshot — complete as of manifest …`; or
- `Local workspace — pending, not published`.

The chain is a source and guarantee profile. The filesystem is the projection.

## 9. Ranked cracks and their likely homes

| Risk | Severity | Likely home | Why it matters |
|---|---:|---|---|
| file-versus-directory hybrid at one path | critical | replacement lens/filesystem projection spec | a native entry needs one stable type; `/foo` cannot simultaneously be a regular file and the parent of `/foo/bar` |
| `UNKNOWN` versus `ENOENT` | critical | lens/read contract + mount profile | silent fallthrough returns the wrong file |
| mount-wide basis and evaluation time | critical | lens/read contract + mount generation | per-handle pinning alone lets one recursive walk mix realms, blocks, lens revisions, or expiry results |
| coherent file generation and authenticated random access | critical | byte manifest + resolver + range reader | size, codec, commitment, mirror, and bytes cannot come from different winners; a whole-file hash cannot authenticate an arbitrary range before the rest is fetched |
| mutable writes versus immutable commits | critical | local journal + SDK + mount daemon | ordinary applications otherwise require absurd signing/publication behavior |
| write actor/signing authority | critical | OS capability broker + KEL/SDK | a writable mount can accidentally become ambient wallet authority |
| rename with path-derived directory identity | high | filesystem-profile vectors; possibly namespace design | POSIX atomicity and EFS redirects may diverge |
| stable directory snapshots and completeness | high | required indexes + lens basis + mount daemon | `readdir` correctness depends on complete deterministic pages |
| cache isolation across lens/basis | high | mount daemon | path-only caches can leak or serve the wrong author's bytes |
| append-only history amplification | high | on-chain indexes + resolver | a small live folder with years of revoked/superseded history can still make lookup and listing unusable |
| same-author multi-device ordering | high | envelope/authority protocol | already-open client gap becomes ordinary concurrent filesystem use |
| inode identity and open-handle pinning | medium | mount daemon | avoids hash collisions and path-resolution races |
| local versus venue durability | medium | client ladder + mount controls | `fsync` must not lie |
| metadata/time synthesis | medium | filesystem profile | apps inspect modes and timestamps even when EFS lacks them |
| unsupported special files/ACLs/locks | bounded | mount profile | truthful `EOPNOTSUPP` is acceptable; silent emulation is not |
| cost/write amplification | medium | journal/coalescer + venue adapter | editors produce far more syscalls than useful public versions |

The critical and high-severity items deserve design-time attention. The rest can mostly remain implementation policy if their behavior is explicit.

## 10. Candidate shape of a deliberately small EFS filesystem profile

The adopted outcome should be backed by a Durable—not Etched—portable read-only profile containing only:

1. rooted tree projection and child-edge rules, including one deterministic entry type for any file/directory hybrid;
2. canonical filename rules plus reversible host presentation/collision behavior;
3. lens collision, shadow, WHITEOUT, and fallthrough behavior;
4. redirect/symlink budgets and cycle behavior;
5. a mount-generation descriptor that pins realm and code basis, finalized evidence basis, lens/policy revision, completeness policy, and evaluation time;
6. basis-bound page cursors and an operational end/closure proof for directories and properties;
7. proven-absence versus incomplete-result mapping;
8. shared EFS object identity versus adapter-local entry/file identity;
9. one coherent selected file generation binding logical identity, resolved metadata, logical size/encoding, content/chunk commitment, byte source, and basis;
10. verified range-read and authenticated-byte-unavailable behavior, including full-fetch-before-serve where a carrier lacks independently verifiable chunks;
11. a curated `user.efs.*`/EA projection plus lossless paged control schema with object-versus-entry attachment scope;
12. synthesized mode, owner/security descriptor, time, file ID, and capacity policy;
13. platform-neutral error classes and native mappings;
14. unsupported operations and exact read-only failures; and
15. one cross-adapter golden fixture and acceptance matrix.

A separate future writable profile would add create/write/truncate/commit intents, rename/unlink transactions, local durability/publication ladder meanings, host-created-name rules, setxattr/property semantics, and signing/capability mediation. Those concerns remain useful pressure-test material below, but they do not block satisfying the current read-only requirement.

Do **not** freeze:

- FUSE itself as the universal OS API;
- one daemon implementation;
- one local database;
- one cache layout;
- one background sync algorithm;
- Unix UID mappings into the record protocol; or
- an Ethereum data-source interface based only on what the FUSE prototype happens to need.

The three host adapters are conformance harnesses and real product surfaces. The browser OS can use the same resolver semantics through native SDK handles without literally mounting a kernel filesystem. FUSE remains an implementation family, not the protocol boundary.

## 11. Suggested falsification ladder

### Phase 0 — pure resolver vectors

Build fixture graphs for:

- one author and several authors;
- file-versus-directory hybrids and a file/directory collision under the same presented path;
- collisions and WHITEOUTs;
- repeated placements sharing one EFS DATA/content identity, with optional native hard-link comparison;
- symlink/redirect cycles;
- moved directories;
- complete and incomplete pages;
- basis-bound cursors, positive page closure, and corrupted or mismatched continuation tokens;
- pinned versus following bases and a wall-clock expiry boundary; and
- missing authenticated bytes;
- whole-file-only commitments versus chunk-authenticated random reads;
- cross-platform name collisions and reversible presentation; and
- bounded versus overflowing/multi-valued/incomplete property sets.

Two independent resolvers must produce the same tree and grades.

### Phase 1 — read-only snapshot through the shared core

Mount one complete signed bundle/local SQLite snapshot through the platform-neutral core and the first host adapter. Support lookup, attributes, directory reads, open/range-read, and diagnostic xattrs/EAs/control files. Add safe `readlink` only if it can be tested consistently.

This tests graph-to-tree, inode mapping, names, links, and ordinary application compatibility without keys, publication, or remote liveness.

### Phase 2 — required milestone: read-only live Ethereum/EVM lens on all three hosts

Add evidence/query reads from the selected Ethereum/EVM venue—potentially Base or Arbitrum—plus pinned directory handles, byte fetching, cache invalidation, strict `UNKNOWN`, and visible basis/grade. Mount the same golden view read-only through Linux, macOS, and Windows adapters. Browse it with each platform's command-line tools and standard graphical file manager. Linux may land first, but Phase 2 is not complete until all three pass.

Acceptance criteria:

- ordinary-user mount/unmount works after any unavoidable one-time runtime installation, and a daemon stall/crash leaves an abortable/recoverable mount;
- one declared EFS root is exposed without a wallet or write key;
- Linux `find`/`stat`/`cp`/`sha256sum` plus one file manager work over representative public datasets;
- macOS `find`/`stat`/`cp`/`shasum` plus Finder/Quick Look work;
- Windows `dir`, PowerShell `Get-Item`/`Copy-Item`/`Get-FileHash`, and Explorer preview/copy work;
- the same fixture yields the same canonical logical entries, byte hashes, property values, and safe link targets on all three, independent of native enumeration order;
- forbidden/reserved, case-colliding, normalization-colliding, long, and near-limit names round-trip through deterministic presentation names without omission or aliasing;
- directory enumeration is deterministic and complete at the pinned basis;
- one recursive walk observes one declared mount generation rather than a mixture of bases or expiry clocks;
- every returned byte stream is checked against the selected content commitment;
- random reads either verify independently against a chunk/range commitment or wait for a complete verified local copy; no unverified prefix is released;
- a missing byte source is distinguishable from a nonexistent path;
- incomplete lens evidence never becomes `ENOENT` or silent lower-priority fallthrough;
- large directories paginate without duplicates or omissions; and
- live-small/history-large directories remain within declared lookup, RPC, memory, disk, and listing budgets; and
- the mounted namespace remains stable for open file and directory handles while the remote venue advances;
- fixed xattrs/EAs and the lossless paged property view agree; oversized/unbounded property sets produce an explicit reference or failure, never truncation; and
- every mutation attempt fails read-only, including host metadata, EA/xattr/stream, rename, delete, local-cache, and tombstone paths.

Passing this phase validates the cross-platform mountability claim and justifies the shared resolver plus host-adapter design. Writable mounts are an independent later extension. Non-EVM substrate support belongs to a different research track.

### Phase 3 — writable local-first workspace

Add staging files, journaled create/write/truncate/rename/unlink, local advisory locks, crash recovery, coalescing, and explicit signed-bundle export. Keep publication off by default.

### Phase 4 — explicit Ethereum publication

Connect the journal ladder to key/capability mediation, signing, submission, admission, finality, and replication. Verify that common editor save patterns produce bounded canonical records and that publication never depends on noticing a successful `close()`.

Phase 2 is the required mounted-filesystem validation. Later phases would provide evidence for writable-mount product ambitions.

## 12. Falsification tests

1. **Cross-platform golden read:** mount one representative Ethereum/EVM EFS root read-only on Linux, macOS, and Windows; native shell tools and graphical file managers traverse, preview, hash, and copy the same logical files without EFS-specific application plugins.
2. **Unknown attack:** omit the highest-priority lens source or one directory page. Lookup does not return a lower file or `ENOENT`.
3. **Lens cache isolation and revocation:** mount two lenses resolving the same path differently. Kernel and daemon caches never cross-contaminate bytes or metadata; TTL/notification tests prevent a followed live mount from indefinitely serving a revoked or superseded winner.
4. **Open-handle stability:** open a file, change the live lens winner, then continue reading. The descriptor returns the version it opened; a new open sees the new winner.
5. **Directory mutation:** mutate the remote view while iterating a large directory. The open snapshot neither skips nor duplicates unrelated entries.
6. **Byte integrity and loss:** corrupt or remove a byte source. Reads fail as authenticated-byte unavailable/corrupt, never return unchecked bytes or report the path absent.
7. **File-ID collision simulation:** force two logical IDs into the same candidate host ID. The adapter table preserves distinct entries; shared EFS identity does not depend on native hard links.
8. **Daemon/network failure:** stall all remote reads. Calls time out or fail according to policy and the mount remains abortable.
9. **Ethereum source consistency:** equivalent authenticated Ethereum evidence obtained through independent RPC/proof sources and a complete local export produces the same logical tree while preserving source-qualified observations.
10. **Name portability:** exercise case pairs, composed/decomposed Unicode, Windows reserved names/characters, trailing dot/space, long components/paths, and control-namespace collisions. No canonical EFS entry is merged, dropped, or made unreachable.
11. **Metadata bounds and privacy:** exercise an 8 KiB Unicode property, a long Unicode key, more than 64 KiB aggregate properties, multi-valued properties, incomplete key enumeration, and a private metadata crawler. Fixed attributes remain bounded; the lossless view remains complete; private metadata does not leak by default.
12. **Read-only enforcement:** create, write, truncate, rename, delete, chmod/ACL/time updates, setxattr/EA/alternate-stream writes, and platform-local overlays/tombstones all fail without masking the EFS view.
13. **Plan 9 semantic vectors:** run the priority, WHITEOUT, proven-absence, `UNKNOWN` anti-fallthrough, enumeration, and pinned-handle fixtures against both the EFS resolver and a Plan 9/union reference model. Expected differences are explicit, especially duplicate union enumeration and lack of Plan 9 whiteouts.
14. **Hybrid-kind projection:** construct DATA-with-children and same-name file/directory candidates. Every host exposes the same canonical single entry type or the same reversible synthetic split; lookup, `stat`, and `readdir` agree.
15. **Mount-generation consistency:** cross an expiry boundary and advance the remote realm during a recursive walk. The mounted generation does not change until an explicit atomic refresh/remount.
16. **Range-verification boundary:** request a late range before any prefix from a whole-file-hash carrier and from a chunk-proof carrier. The first waits for full verification; the second serves only after the requested proof verifies.
17. **History amplification:** compare a large live folder with a folder having the same live result plus 99% revoked/superseded history. Enforce declared cold/warm latency, RPC, memory, disk, and spill budgets.

Writable follow-up tests, if that work is commissioned:

18. **Rename crash matrix:** crash after every internal step of move/replace/WHITEOUT/redirect. Recovery exposes either old or new state, never a torn hybrid.
19. **Editor storm:** save with Vim, Emacs, VS Code, LibreOffice, and a compiler/build tool. Temporary files and renames coalesce without accidental public spam.
20. **No-sign-on-syscall:** instrument every syscall. No normal write, flush, release, or mmap page triggers an ambient wallet signature.
21. **Durability honesty:** after successful default `fsync`, kill the daemon and disconnect every network. Local work survives, but UI/control metadata does not claim venue admission.
22. **Key separation:** change Unix UID, Ethereum relayer, RPC endpoint, or storage credentials. EFS authorship does not change.
23. **Public unlink:** unlink the last visible name. The path disappears, open handles survive, and the mount never claims remote bytes were physically erased.
24. **Unsupported semantics:** attempt device nodes, setuid, global locks, ACL changes, and atomic cross-author rename. Each is rejected or explicitly local—never silently overstated.

## 13. What this changes in the broader EFS research

This pass strengthens, rather than weakens, the current direction:

- **Files and folders remain an excellent human projection.** They are simple enough to expose everywhere.
- **Tags and graph edges remain a useful substrate.** The filesystem profile chooses which edges become tree structure; it need not erase the larger graph.
- **Lenses are not a weird extra.** They are a generalized union/overlay and trust policy. The weirdness appears only when ordinary filesystem APIs lack a vocabulary for grades, provenance, and changing view policy.
- **Plan 9 validates the namespace idea.** Per-process namespaces and ordered unions are strong precedent for reader-chosen views; EFS extends the model with authenticated evidence, typed combiners, completeness, WHITEOUTs, and fail-closed `UNKNOWN`.
- **The local journal is foundational.** It is the mutable working filesystem beneath immutable signed/public versions.
- **Ethereum remains the first and currently best-specified rich-profile candidate.** It is intended to supply authority, durable public evidence, required indexes, and contract composability that a local or provider-backed mount cannot.
- **Ethereum RPCs, local exports, caches, and byte stores can serve the same mounted projection without becoming the same trust source.** Their differences remain explicit and graded.
- **EFS should not be branded as fully POSIX or NTFS-like.** A strict cross-platform read-only subset with native EFS metadata is more honest and probably more elegant.

The primary open architectural question is:

> **Can EFS define one deterministic, bounded read-only filesystem projection over Ethereum/EVM state whose logical results remain identical through Linux, macOS, and Windows adapters, with honest absence, stable directory traversal, portable names, bounded metadata, and verified content retrieval?**

Current design analysis and three independent expert passes suggest yes; implementation evidence does not yet exist. `UNKNOWN`, exact child/property enumeration, basis pinning, portable-name escaping, cache invalidation, byte availability, and adapter lifecycle need prototypes before the answer is promoted. Rename and the mutable-staging/signing boundary belong to the optional writable follow-up.

## Open questions

Read-only validation:

- [ ] Which Ethereum/EVM profile and representative public dataset should the first mount target?
- [ ] Is the initial root a single-author tree, a pinned personal lens, or one fixture for each?
- [ ] What canonical projection turns DATA-with-children or same-name file/directory candidates into one host entry type without losing either meaning?
- [ ] Is the required MVP a mount-wide immutable generation with refresh-as-remount, and exactly which realm/code/block/lens/evaluation-time fields identify that generation?
- [ ] What basis-bound cursor and high-watermark/end receipt proves a direct-child or property enumeration complete enough for `ABSENT_PROVEN`?
- [ ] What selected-file-generation tuple prevents size, encoding, content commitment, mirror, and bytes from resolving from different claims?
- [ ] Which byte carriers can authenticate arbitrary ranges, and which must fully fetch/hash/cache before returning any requested range?
- [ ] What exact errno mapping is least harmful for `UNKNOWN`, stale currentness, and authenticated-but-unavailable bytes?
- [ ] Can a complete snapshot/manifest make the most useful mount profile grade-free for ordinary applications?
- [ ] Should the live read-only mount refresh automatically or only at remount/explicit checkpoint to preserve application determinism?
- [ ] What is the reversible presented-name encoding and collision rule, and should the rejected-leading-`~` grammar make `~efs` the synthetic control entry instead of colliding with a real `.efs`?
- [ ] Is arbitrary resolved property enumeration required through xattrs/EAs, or is the bounded projection plus paged control/API surface the normative split?
- [ ] Which Linux file manager and exact Linux/macOS/Windows versions, CPU architectures, tools, and previews form the launch acceptance corpus?
- [ ] On macOS, do we lead with macFUSE's FSKit backend, a legacy-compatible macFUSE path, a native FSKit adapter, or a measured combination? Resolve support floor, installation, notarization, redistribution/license constraints, and the June 2026 FSKit Handler/DataCacheHandler API transition. ([FSKit updates](https://developer.apple.com/documentation/updates/fskit))
- [ ] On Windows, confirm WinFsp as the conformance adapter and whether the FUSE-compatible layer is sufficient or a native adapter is needed for correctness/performance.
- [ ] What numeric cold/warm lookup/list/range-read, RPC, memory, disk, and history-amplification budgets define a usable mount at 50 and 256 principals?
- [ ] Should a read-only 9P server be a fourth semantic validation adapter after the three required hosts, or remain fixture-level prior-art validation?

Writable follow-up—not required to validate the read-only milestone:

- [ ] Is path-derived TAGDEF identity worth the redirect complexity once subtree rename is implemented against real applications?
- [ ] Is the default mount a single-author home, a personal upper layer over a lens, or both as separate profiles?
- [ ] Does default `fsync = local journal durable` match user expectations, and what explicit control requests signing/publication?
- [ ] What explicit author/slot/signing semantics would a future `setxattr` need before it can create or remove EFS properties?
- [ ] How do rename, WHITEOUT, and `movedTo` compose in one same-author envelope?
- [ ] What is the normative same-author multi-device conflict/order rule?
- [ ] Which apps form the compatibility target? Source trees, media archives, package stores, and personal documents need less POSIX surface than databases and VM images.

## Read-only milestone checklist

- [ ] Pure resolver vectors cover every Phase 0 case
- [ ] `UNKNOWN`/absence and directory-enumeration rules reconciled with the replacement lens spec
- [ ] Hybrid file/directory projection, mount-generation identity/evaluation time, basis-bound page closure, and coherent file-generation semantics are fixed in resolver vectors
- [ ] Read-only bundle mount passes ordinary filesystem test suites and representative EFS apps
- [ ] Live Ethereum/EVM mount passes the Linux shell + file-manager corpus
- [ ] The same golden view passes the macOS shell + Finder/Quick Look corpus
- [ ] The same golden view passes the Windows shell/PowerShell + Explorer corpus
- [ ] Portable-name, exact-property-enumeration, metadata-bound, read-only, and control-name-collision vectors pass on all three
- [ ] Security review covers adapter request observation, metadata indexing/leakage, path traversal, deadlocks, unbounded graph work, platform packaging, and verified bytes
- [ ] History-heavy benchmarks and crawler-storm fixtures prove metadata operations do not hydrate file content or exhaust memory/disk/RPC budgets
- [ ] Independent Ethereum sources and a complete local export produce the same golden tree
- [ ] No implementation-specific FUSE/FSKit/WinFsp, database, UID/SID, presented-name escape, or chain locator leaks into canonical artifact identity
- [ ] At least one round of `#status/review` with another agent or human comment

Writable follow-up checklist, if commissioned:

- [ ] Key/signing capability isolation reviewed
- [ ] Crash injection covers local staging, journal, rename, and unlink transactions
- [ ] Representative editor-save workloads coalesce into bounded EFS intents
- [ ] `fsync` and publication ladder semantics are explicit and tested
