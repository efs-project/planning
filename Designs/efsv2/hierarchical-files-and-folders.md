# EFS 2.0 — Hierarchical files and folders

**Status:** review — converged semantic proposal; exact bytes and measured limits remain evidence-gated
**Target repos:** planning, sdk
**Proposed new repos:** core, os, drive; contracts/client remain legacy evidence
**Depends on:** V2-E1 uniform-Principal comparison, V2-E4 costing, V2-E6 Web/OS execution, and the Stage A B0 candidate
**Inputs:** [[system-constitution]], [[core-architecture-candidate]], [[mountable-filesystem-semantics]], [[assumptions-and-requirements]], and the [Stage A corpus](../../Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md)
**Authority:** [[owner-rulings]] — especially the 2026-08-12 greenfield boundary and the adopted Linux/macOS/Windows read-only outcome
**Supersedes:** the July path-derived TAGDEF, redirect/moved-to, global whiteout-object, and DATA/file-hybrid mechanisms in [[fs-pass-synthesis]] and related historical files; it does not supersede [[mountable-filesystem-semantics]]'s adopted three-host outcome or acceptance tests
**Reviewers:** @files-core-exact-review, @files-requirement-matrix, and @files-schema-redteam (2026-08-14)
**Last touched:** 2026-08-14

#status/review #kind/design #repo/planning #repo/sdk #topic/efsv2 #topic/content #topic/read-path #topic/lenses

> **Authority and release truth.** This document is a greenfield engineering
> proposal, not an owner ruling, freeze, deployed interface, or claim that
> Stage B has implemented Files. The live owner queue still has no immediate
> Files question. Rich Unicode, `BindingScope`, router-bound consent,
> `FilesRouter`, and the first
> public/single-Realm fixture are experiment arms. Return only an irreducible
> product or permanence fork to the owner.

## Problem

EFS needs ordinary, hyperlinkable folders and files without collapsing its
portable Records, Realm-qualified admission, plural authority, immutable byte
identity, and honest incomplete-read semantics into a conventional mutable
filesystem inode table. A link such as:

```text
web3://efs.eth/myfolder/mysubfolder/myfile.jpg
```

must resolve predictably. A browser, contract-aware client, Linux mount, macOS
mount, and Windows mount must agree about the logical tree and bytes even when
their native pathname rules differ. Renames must not re-identify descendants;
directory listings must be complete without trusting a hosted database;
corrupt or unavailable carriers must not turn into missing files; and a Lens
must not silently fall through an unavailable or malformed higher-priority
claim.

Current B0 already supplies most of the substrate: portable typed Records,
authored Occurrences, Realm admission, Principal-qualified Bindings, bounded
ResolutionPlans, exact content commitments, mandatory indexes, and paged reads.
It does **not** yet define a Files profile, a canonical URL/name grammar, a
complete way to enumerate unknown Binding positions in one directory, or
filesystem-level mutation preconditions across a plural Plan.

## Decision summary

1. A file or directory is one stable `ObjectGenesis/1` Object. Its name and
   parent are placements, not identity.
2. Each immediate child name is a Principal-qualified Binding position under
   its parent Directory Object. A `ResolutionPlan` chooses the effective value.
3. A bound `DirectoryWhiteout/1` masks lower Plan tiers. A Core
   `BindingTombstone` means that Principal makes no claim and therefore permits
   fallthrough.
4. `MountDescriptor/1` is the extensible authority boundary. Its public
   Files/1 config separates the plan controlling immediate child names from the
   plan controlling file revisions; external-link and encrypted-directory
   configs cannot be mistaken for public mounts.
5. Known-name lookup needs no new Core primitive. Complete `readdir` requires
   one generic proposal, `KIND_BINDING_SCOPE`, which enumerates Binding roles
   ever created under `(Principal, purpose, subject)`. Enforceable
   view-conditional writes require a second generic successor input: an
   executor- and operation-bound Admission consent.
6. A file's stable Object, immutable `FileRevision/1`, exact `ChunkTree/1`, and
   byte Locators are separate. Locators never become content identity.
7. Client traversal may follow any practical number of segments. A separate
   ERC-6944/5219 compatibility adapter makes friendly `web3://` links work
   within an advertised, measured contract budget; it is not part of Core.
8. Filesystem snapshots are real block-hash-pinned Realm views, never arbitrary
   mid-envelope admission prefixes.
9. The public Files profile is plaintext and topology-public. Private subtrees
   require a separate encrypted-manifest mount profile; hashing public name
   positions is not privacy.
10. The canonical Files model is platform-neutral. Host filenames, inode/file
    IDs, xattrs, caches, and adapters are reversible projections, never EFS
    identity.

## 1. Layer boundary

### 1.1 Generic Core

Files consumes these generic concepts without renaming them:

- `PrincipalId` and an authority basis;
- immutable `TypeSchema` and author-neutral `Record`;
- authored `Occurrence` inside a signed Envelope;
- Realm admission, receipts, revision history, and high-water enumeration;
- `BindingSet/1`, `BindingTombstone/1`, and Binding history;
- `ResolutionPlan/1` for bounded contract-level Lens evaluation;
- declared typed backlinks and paged index reads;
- `Withdrawal/1` as carriage/authorship lifecycle, not application deletion;
- content Records such as `ChunkTree/1`, `Locator/1`, `ByteDigest/1`, and
  `RepresentationBinding/1`.

Core does not acquire privileged `FILE`, `DIRECTORY`, `PIN`, `TAG`, `PROPERTY`,
`PATH`, or `SYMLINK` effects. Files Types are ordinary reusable application
Types. A PIN-like operation is a Binding; a tag is a many-valued relationship
Record; a property is a typed fact and optionally a Binding-selected current
fact.

### 1.2 Files profile

Files/1 owns:

- node-kind meanings;
- directory-entry, whiteout, revision, mount, and route Types;
- name and URL grammar;
- position purposes and field roles;
- application validation beyond MC/1 structure;
- point traversal, directory listing, and filesystem result semantics;
- filesystem-level transaction preconditions in `FilesRouter`;
- canonical view and citation transcripts;
- byte acquisition and host projection rules.

The SDK, Web Client, OS, and mounts share one resolver core. An adapter may not
invent a different logical tree to suit its host.

The uniform `PrincipalId` surface used below is the current V2-E1 experiment
arm, not owner law. No permanent Files Type bytes may be minted until V2-E1
closes. A different Principal arm must preserve the same point-verifiable
charter, Binding, historical-authority, and reconstruction properties.

## 2. Canonical names and hyperlinks

### 2.1 FilesName/1 candidate

The primary experiment arm is a rich, case-sensitive Unicode name:

- encoded as a `STRING(255)` field;
- 1–255 UTF-8 bytes **after** NFC normalization;
- set-wide `UNICODE_PIN` shared with MC/1 `STRING` semantics; candidate pin is
  Unicode 17.0.0, replacing rather than coexisting with B0's proposed 16.0 pin;
- strict UTF-8; assigned scalar values only; no BOM or noncharacters;
- no empty name, `.`, `..`, `/`, `\\`, General Category `Cc` (including
  U+007F), line/paragraph separators, bidi-control characters, or
  replacement/object characters;
- no `Default_Ignorable_Code_Point` except code points occurring inside an
  exact fully-qualified RGI Emoji sequence from the pinned table; no
  stand-alone joiner, variation selector, soft hyphen, or zero-width space;
- no leading or trailing Unicode whitespace; implementations never trim;
- byte-exact, case-sensitive equality and bytewise canonical sorting;
- no case folding, NFKC, locale collation, or confusable folding.

The freeze bundle must archive and hash the exact Unicode data and rule tables,
including `Age`, `General_Category`, `White_Space`, `Bidi_Control`,
`Default_Ignorable_Code_Point`, noncharacters, and fully-qualified RGI Emoji.
ENS name normalization is separately governed by ENSIP-15; it never reuses the
FilesName validator. UIs isolate or escape bidi/display-unsafe names, and host
projection aliases them even when the native filesystem technically accepts
their bytes.
The SDK/Web/OS/mount performs full NFC/codepoint/profile validation. Core's
`STRUCT-EVM` tier verifies strict UTF-8 and length and routes exact bytes. A
result must distinguish:

```text
EXACT_BYTES_ONLY          Core proved structural bytes and exact hashes
FILES_PROFILE_VALIDATED   a conforming Files validator proved the full profile
```

These are closed `u8 profileValidationGrade` values `1` and `2`; zero is
`UNVALIDATED` and cannot support a positive Files result. The grade applies to
the exact result dependency chain, not merely its terminal Record. An aggregate
grade is the weakest grade among every selected Entry, Mount/config, node
charter, revision, and name used for that result.

The immutable FilesRouter is application code, not Core, but it still may claim
only what its runtime can prove. The first contract-checkable arm proves the
full Files profile for `FILES_ROUTER_ASCII_NAME_V1` directly:

```text
1..255 bytes, every byte in [a-z0-9._-], excluding exactly "." and ".."
```

Every such byte string is also a valid rich FilesName. A rich name outside this
subset returns `UNSUPPORTED(PROFILE_VALIDATION)` before writes until a later immutable,
codehash-pinned Router can prove the archived Unicode profile within measured
gas/size bounds. An offchain SDK verdict is not an onchain proof. Therefore a
Router receipt labeled `FILES_PRECONDITION_CERTIFIED` requires
`FILES_PROFILE_VALIDATED` for every relevant pre/postcondition component;
structural `EXACT_BYTES_ONLY` state remains readable and generically publishable
but cannot receive that certification.

An authenticated but profile-invalid selected entry is
`MALFORMED_SELECTED`; it does not fall through. ASCII slug plus a separate
Unicode display label remains the fallback arm only if rich names fail the
contract, URL, or three-host conformance gates. This is an engineering gate,
not an immediate owner question.

### 2.2 URL representation

Name identity is normalized UTF-8 bytes. Percent encoding exists only at the
URL boundary and is never stored as the name. The canonical serializer emits
RFC 3986 unreserved ASCII directly and every other byte as uppercase `%HH`.

Examples:

```text
name bytes                 canonical segment
myfile.jpg                 myfile.jpg
Q&A #1.jpg                 Q%26A%20%231.jpg
猫.jpg                      %E7%8C%AB.jpg
literal "%2F"             %252F
```

No path prefix is reserved. Real entries may be named `.efs`, `__efs`,
`control`, `files`, or `efs-control`. Files gateways reserve only the decoded,
exact, case-sensitive ASCII query key `efs-control`; other ordered query pairs
are terminal application input and never affect path resolution. Query pairs
split on literal `&`, key/value on the first literal `=`, percent-decode once,
treat `+` literally, require strict UTF-8 values and ASCII keys, preserve pair
order, and reject empty keys, duplicate decoded controls (including
`%65fs-control`), an unknown control version, or a control/path mismatch.
Canonical serialization uses uppercase `%HH`, literal unreserved bytes, and an
explicit `=` even for an empty value. Fragments are client-local and never
enter Core resolution; a future private capability may use a fragment without
disclosing it to the route contract.

`canonicalPathBytes` is the ASCII byte string of the absolute canonical path:
exactly one leading `/`, serialized segments joined by one `/`, a trailing `/`
iff the resolved terminal is a directory, and no query or fragment. Root is
the one byte `/`. `applicationQueryBytes` is the canonical serialization of
only the ordered non-control pairs as `key=value` joined by literal `&`, with
no leading `?`; for no application pairs it is the empty byte string.
`applicationQueryHash = keccak256(applicationQueryBytes)`, including
`keccak256("")` for empty. These exact bytes, not a parsed map, enter citations
and cache keys.

### 2.3 One convergent parser

Every ingress converts to canonical segment bytes through the same conceptual
pipeline:

1. Split fragment and query before interpreting names.
2. Split a raw path on `/` before percent decoding.
3. Validate every `%HH` triplet and percent-decode exactly once. An already
   decoded ERC-5219 `resource[]` enters after this step and is never decoded
   again.
4. Decode strict UTF-8. A navigation/user constructor NFC-normalizes each
   segment; a stored, signed, or citation constructor rejects non-NFC bytes.
5. For every ingress, collapse empty components and apply the same lexical
   `.`/`..` traversal on the once-decoded components; `..` above root rejects.
   Reapplying this to decoded `resource[]` is idempotent and closes gateway
   differences. Literal `%2E%2E` still arrives as the decoded text `%2E%2E`
   from `%252E%252E`, not as a dot component. Dot components are navigation,
   never stored names.
6. Validate each remaining segment as `FilesName/1`.
7. Re-serialize canonically when producing a link or signed/cited path.

Consequences:

- `%2F` decodes to `/` and is invalid inside a name;
- `%252F` is the literal name `%2F`;
- `%2E%2E/x` navigates outward before resolving `x`;
- `%252E%252E` is the literal name `%2E%2E`;
- `/a//b/`, `/a/b`, raw ERC-6860 manual input, and decoded ERC-5219 input
  converge to the same two semantic segments;
- `/directory` and `/directory/` look up the same slot, but after kind
  resolution a directory's canonical presentation URL ends in `/` and a
  file's does not. An HTTP/ERC-5219 adapter returns an actual canonical
  redirect before any body that may resolve relative links. A renderer without
  redirect semantics must set the document's effective base URL to that same
  canonical directory URL before parsing content; `Content-Location` alone is
  insufficient. Root is `/`.

Navigation may accept and canonicalize a valid noncanonical spelling. An exact
signed/citation input requires byte equality with the canonical serialization.
Malformed UTF-8, percent syntax, or path controls reject before any Binding
read.

### 2.4 Friendly web3:// invocation

The friendly route is one explicit compatibility contract, not an ambiguous
mix of manual calldata and decoded resources:

```solidity
function resolveMode() external pure returns (bytes32) { return "5219"; }

function request(string[] memory resource, KeyValue[] memory params)
  external view
  returns (uint16 statusCode, string memory body, KeyValue[] memory headers);
```

The `request` ABI is Final ERC-5219. Draft ERC-6944 separately defines the
`"5219"` resolve mode; Draft ERC-6860 separately maps Web3 URLs to contract
calls and currently distinguishes auto/manual behavior. Files freezes one
explicit versioned composition of those drafts rather than implying either
standard alone settles the bridge.
The adapter receives already-decoded `resource[]`/`params[]` and never applies
percent decoding again. A separate manual-mode adapter, if shipped, receives
raw ASCII `pathQuery` and runs the raw pipeline in §2.3; it is not the same
entrypoint.

The EFS translator parses the raw query with §2.2, then passes Final ERC-5219
`KeyValue[]` in the same decoded pair order: `+` remains `+`, `%2B` also decodes
to `+`, `%20` to space, `%26`/`%3D` stay inside one decoded value, and an empty
value is the empty string. The adapter canonical-reserializes the decoded
pairs and rejects a second/aliased `efs-control`, unknown version, or mismatch.
Raw-gateway and manual vectors cover these cases; no ambient framework query
parser may substitute form-URL-encoded `+` semantics or reorder duplicates.

`web3://efs.eth/...` first resolves the normalized ENS name and exact
ERC-6821 `contentcontract` record, including its effective chain override, to
this adapter. A discovery receipt records requested/effective chain, ENS name,
registry/resolver, record bytes, adapter, and resolution block. Address-form
fallback is `web3://0x<adapter>:<chainId>/...`. ERC-6860 `userinfo` may alter
the EVM `from`, but Files results are caller-independent: it never selects a
Plan, Principal, route, or permission.

Clients that do not implement draft ERC-6944 need an EFS-aware handler or an
HTTPS gateway. Final ERC-5219 has a `string` response body; arbitrary binary,
Range, and rich diagnostic APIs therefore use the EFS-native interface or a
standards-tested external-body/chunk compatibility response. Generic web3
clients are not claimed to verify arbitrary external-body bytes.

### 2.5 Depth and transport bounds

The semantic hierarchy has no protocol depth cap: a client repeats point
resolution at one pinned view. Every Files/1 client must support at least 256
segments, 32,768 decoded path bytes, and 64 mount transitions; it may advertise
larger limits. RPC, page, proof, memory, and wall-time budgets remain typed and
resumable. Exhaustion is `RESOURCE_LIMIT/PARTIAL` or `UNKNOWN`, never
`ABSENT`/`404`; HTTP `414` is used only when the request-target itself is too
long.

An overlong host or URL path remains reachable through the EFS-native direct
`(FilesView, MountDescriptor, Object)` API. The control-query codec for a
shareable direct link is frozen with the exact-citation codec in §6.3. B0's
deferred candidate `PATH/1 <= 4` is not adopted. The friendly adapter must
eventually demonstrate a deployment floor of 16 segments and 128 total Plan
candidate evaluations or return typed `RESOURCE_LIMIT`; Core itself never
acquires a full-path loop.

## 3. Stable Objects and Files Types

The admitted MC/1 candidate Types introduced here are
`DirectoryEntry/1`, `DirectoryWhiteout/1`, `FileRevision/1`,
`MountDescriptor/1`, `PublicFilesMountConfig/1`,
`ExternalFilesLinkConfig/1`, `FilesRouteConfig/1`, and `FilesOperation/1`;
they reuse the generic
`ObjectGenesis/1`, `ResolutionPlan/1`, `ChunkTree/1`, Locator/evidence, and
Binding kernel Types. The encrypted config and optional derivation/snapshot
Types remain deferred.

`FilesName/1` is a field/profile rule, not a Record Type. `FilesViewV1`,
`FilesFinalityReportV1`, `FilesExactControlV1`, resolution transcript,
`DirectoryProjectionV1`, and
`HostEntryMetadataV1` are versioned derived codecs/results, not MC/1 blobs or
admitted Records. `RoutedAdmissionIntent/1` is a signed Core interface
structure, not an application Record. A future proposal may admit one of these
derived artifacts as evidence only by defining and minting a separate exact
Type.

### 3.1 Shared ObjectGenesis/1

Files reuses the generic Object charter rather than introducing
`FsNodeGenesis`:

```text
ObjectGenesis/1 {
  publisher Principal
  salt      bytes32
  meaning   option(bytes32)
}
```

The exact generic schema/blob and TypeSchemaId are a B0 freeze obligation; the
Stage B opaque placeholder is insufficient. Files requires a high-entropy salt
and a present meaning equal to one of:

```text
FILES_FILE_1      = keccak256("efs2/files/meaning/file/1")
FILES_DIRECTORY_1 = keccak256("efs2/files/meaning/directory/1")
```

Changing FILE to DIRECTORY creates a new Object. `publisher` is not an owner
field: Records are author-neutral. It nominates the one Principal whose charter
Binding can make this Object a valid Files node. No separate publisher-authored
ObjectGenesis occurrence is required; the authenticated charter Binding below
is the sole authorship/acceptance fact. Republishing the same Record does not
transfer control. Current visibility/control comes only from
Principal-qualified Bindings and the risk-bearer's plans.

The matching publisher charter is proved without an attacker-sprayable
occurrence scan. The publisher creates a deterministic charter Binding in the
same operation:

```text
PURPOSE_OBJECT_CHARTER_V1
  = keccak256(abi.encode(DOM_PURPOSE,
      keccak256("objects/publisher-charter/1")))

position = PositionKey(PURPOSE_OBJECT_CHARTER_V1,
                       ObjectId,
                       bytes32(uint256(1)))
binding  = BindingKey(publisherPrincipalId, position)
target   = RECORD(ObjectGenesis RecordId), targetLeaf = 0
```

A Files node becomes historically valid when that publisher-qualified Binding
first reaches `BOUND` with the exact charter target. It is currently maintained
only while the current head is `BOUND` to that same ObjectGenesis Record with
an active source. Tombstone/Withdrawal or a BOUND rebind to any other target
changes the separately reported grade to not-maintained/malformed; it does not
erase the stable Object or its historical charter. A first tombstone without a
prior charter is not a valid node. This point proof is an application-profile
use of generic Binding, not a new Core Object effect.

### 3.2 DirectoryEntry/1 and DirectoryWhiteout/1

```text
DirectoryEntry/1 {
  parent         ref(object ObjectGenesis/1)  // DIRECTORY meaning
  name           string(255)                  // FilesName/1
  child          ref(object ObjectGenesis/1)  // FILE or DIRECTORY meaning
  mountOverride  option(ref(record MountDescriptor/1))
}

DirectoryWhiteout/1 {
  parent         ref(object ObjectGenesis/1)  // DIRECTORY meaning
  name           string(255)                  // FilesName/1
}
```

The selected Binding target for a name slot must use `targetKind=RECORD`,
`targetLeaf=0`, and exactly one of these two Types. It may not target an
Occurrence, bare Object, or bare Mount: repeating parent and name makes the
hashed role reversible during listing and makes cross-field validation
explicit. `mountOverride.rootNode` must equal `child`.

Profile validation checks parent/directory meaning, child meaning, canonical
name, position derivation, and mount equality. Core may admit evidence that
would form a cycle in some resolved view: cycle validity is contextual, not an
MC/1 property. A certified writer performs a bounded selected-ancestor
preflight and refuses certification on `UNKNOWN` or `RESOURCE_LIMIT`. Every
reader keeps an active ancestor stack keyed by
`(realmId, filesViewId, mountDescriptorId, nodeId)` and returns `LOOP` when a
selected directory re-enters it. Reopening an identical Realm/route/basis does
not evade the check by receiving a new leg ordinal; distinct view contexts are
still bounded by the 64-mount-transition limit. Directory Objects may have
several placements; no portable canonical parent exists and `..` remains
lexical URL traversal.

### 3.3 FileRevision/1

```text
FileRevision/1 {
  node            ref(object ObjectGenesis/1) // FILE meaning
  content         ref(record ChunkTree/1)
  mediaType       string(255)
  charset         option(string(64))
  executableHint bool
  parents         array(max=8, ref(record self))
}
```

Rules:

- zero parents is an initial revision; one is an ordinary edit; two through
  eight represent a merge;
- parents are unique and bytewise sorted;
- every parent names the same File Object;
- larger merges stage intermediate revisions;
- MIME/charset obey the exact `FILES_MEDIA_HINTS_V1` lexical profile below;
- `executableHint` is display/runtime-request metadata, never authority to
  execute;
- currentness comes only from a file-head Binding.

`FILES_MEDIA_HINTS_V1` is deliberately lexical and registry-independent:

```text
mediaType = type "/" subtype
type      = 1..127 MEDIA_TOKEN bytes
subtype   = 1..127 MEDIA_TOKEN bytes
charset   = absent, or 1..64 MEDIA_TOKEN bytes

MEDIA_TOKEN = lowercase a..z | 0..9 |
              ! # $ % & ' * + - . ^ _ ` | ~
```

The complete `mediaType` is therefore 3..255 bytes. Uppercase, whitespace,
parameters, empty components, non-ASCII, and every other byte reject. `charset`
is an opaque lowercase display token such as `utf-8`; this version does not
claim IANA registry membership or infer a charset from MIME. The freeze bundle
hashes this grammar and carries TS/Rust/Solidity valid/invalid vectors so
`PRESENT_FILE` versus `MALFORMED_SELECTED` cannot depend on a local MIME parser.

Copy/import/transform provenance is not overloaded into parentage. A separate
many-valued `FileDerivation/1` relationship may link sources. A copy receives a
new File Object and initial revision, and may reuse the same ChunkTree.

### 3.4 MountDescriptor/1 and public Files mounts

```text
MountDescriptor/1 {
  rootNode  ref(object ObjectGenesis/1)
  profileId bytes32
  configRef ref(record ANY)
}

PublicFilesMountConfig/1 {
  namespacePlan option(ref(record ResolutionPlan/1))
  contentPlan   ref(record ResolutionPlan/1)
  metadataPlan  option(ref(record ResolutionPlan/1))
  propertyProfile option(ref(record ANY))
}

ExternalFilesLinkConfig/1 {
  targetChainNamespace bytes8
  targetChainReference bytes32
  targetCoreAddress bytes20 // MC/1 BYTES_FIXED(20)
  targetRealmId bytes32
  targetMountId bytes32  // MountDescriptor RecordId in targetRealmId
  targetRouteConfigId bytes32 // FilesRouteConfig RecordId in targetRealmId
}
```

- `FILES_PUBLIC_MOUNT_PROFILE_V1` requires `configRef` to target
  `PublicFilesMountConfig/1`. A DIRECTORY root requires both plans; a FILE root
  requires absent `namespacePlan` and present `contentPlan`. `metadataPlan` and
  `propertyProfile` are either both absent (fixed EFS diagnostics only) or both
  present and valid under §10.1.
- `FILES_EXTERNAL_LINK_PROFILE_V1` requires
  `ExternalFilesLinkConfig/1`. The nonzero target Core address is interpreted
  from its exact 20 bytes. Version 1 permits only
  `targetChainNamespace=0x6569703135350000` (`eip155\0\0`) and a nonzero
  uint256 EIP-155 chain ID in `targetChainReference`; every other namespace is
  reserved for a separately tagged backend profile. Its descriptor must
  recompute `targetRealmId` from the named ChainRef/Core/profile/genesis before
  any target read. The target
  Mount must resolve in that Realm and repeat the same root Object before a new
  view leg opens. The target Route must name that Realm/root Mount, a compatible
  Files profile, and its own explicit basis/completeness/freshness policy; no ambient
  chain, deployment, registry, or default route is substituted.
- `FILES_ENCRYPTED_DIRECTORY_PROFILE_V1` reserves an encrypted-manifest config
  Type. Until that profile is frozen, it returns `ACCESS_REQUIRED/OPAQUE`, not
  public traversal.
- An unknown `profileId`, wrong config Type, or mismatched root is
  `UNSUPPORTED`/`MALFORMED_SELECTED` and never falls through.
- Direct child entries inherit the active mount.
- `mountOverride` switches authority before evaluating the child.
- Plans are immutable and mount-local, never route-global ambient caller input.

The public profile covers the important foreign-file case: a directory curator
may place Alice's File Object while mounting Alice's content plan at that leaf.
The curator cannot silently repoint Alice's selected FileRevision. Descriptor
indirection makes private and cross-Realm semantics representable without
weakening the public Type or treating an unknown profile as a public mount.

Every referenced Plan must carry an exact Files purpose/scope:

```text
FILES_NAMESPACE_PLAN_PURPOSE_V1
  = H(DOM_PURPOSE, H("files/namespace-plan/1"))
FILES_CONTENT_PLAN_PURPOSE_V1
  = H(DOM_PURPOSE, H("files/content-plan/1"))
FILES_METADATA_PLAN_PURPOSE_V1
  = H(DOM_PURPOSE, H("files/metadata-plan/1"))
scope = H(DOM_FILES_PLAN_SCOPE, filesProfileId, rootNode)
purposeAndScope = H(DOM_PLAN_PURPOSE, purposeTag, scope)
```

Mount validation, lookup, listing, and writes compare the corresponding
`purposeAndScope`. A generic Plan with the wrong purpose or root is
`MALFORMED_SELECTED`; a caller cannot reuse a trusted Plan outside its scope.

### 3.5 FilesRouteConfig/1

```text
FilesRouteConfig/1 {
  realmId            bytes32
  rootMount          ref(record MountDescriptor/1)
  filesProfileId     bytes32
  basisMode          uint8    // REALM_FINAL | REALM_HEAD
  completenessPolicy uint8    // REQUIRE_PROVEN | ALLOW_GRADED
  freshnessPolicyId  bytes32  // zero = NO_FRESHNESS_CLAIM
  writeRouter        bytes20  // MC/1 BYTES_FIXED(20); zero for read-only
  writeRouterCodeHash bytes32 // zero iff writeRouter is zero
}
```

Network endpoints, RPCs, gateways, caches, and proof providers are local
transport configuration. A portable mount requires `REQUIRE_PROVEN`; a live
Web view may expose a graded mode explicitly. A friendly ENS/content-contract
route may select a current config. An exact citation binds the config and view
directly and does not trust later ENS repointing. A nonzero writer is the exact
executor for §8.2 consent; its runtime code hash is checked before signing and
execution. The MC/1 decoder interprets `writeRouter BYTES_FIXED(20)` as the
exact EVM address bytes (no ABI word, text, or checksum spelling). It is all
zero exactly for a read-only route; `writeRouterCodeHash` is then also zero.
For a writable route both are nonzero and the current account code hash must
match before the config is selected.
`freshnessPolicyId` selects one frozen consumer rule over observation time and
chain/head evidence; zero makes no freshness claim. Freshness is reported, not
folded into content identity or finality.

## 4. Binding positions and point resolution

### 4.1 Stable purposes and roles

Files positions use stable purpose tags, not Files TypeSchemaIds:

```text
PURPOSE_FILES_NAME_SLOT_V1 = keccak256(abi.encode(
  DOM_PURPOSE, keccak256("files/name-slot/1")))

PURPOSE_FILES_REVISION_HEAD_V1 = keccak256(abi.encode(
  DOM_PURPOSE, keccak256("files/revision-head/1")))

nameRole(nameBytes) = keccak256(abi.encode(
  DOM_FIELDROLE, keccak256(nameBytes)))

FILE_REVISION_ROLE_V1 = keccak256(abi.encode(
  DOM_FIELDROLE, keccak256("files/current-revision/1")))
```

For a directory `D` and name `N`:

```text
position = PositionKey(PURPOSE_FILES_NAME_SLOT_V1, D, nameRole(N))
binding  = BindingKey(principalId, position)
```

For a File Object `F`, its current revision position uses
`PURPOSE_FILES_REVISION_HEAD_V1`, subject `F`, and
`FILE_REVISION_ROLE_V1`.

### 4.2 Name lookup

At one exact Files view:

1. Load and validate the active directory Mount and namespace Plan.
2. Derive the one name position.
3. Resolve the Plan over Principal-qualified Binding heads.
4. Interpret outcomes:
   - Binding `UNSET`/tombstone: that Principal has no candidate;
   - bound `DirectoryWhiteout` as a RECORD target with leaf zero: `MASKED`,
     with no lower-tier fallthrough;
   - bound valid `DirectoryEntry` as a RECORD target with leaf zero: select
     child and optional Mount;
   - bound wrong-Type, mismatched parent/name/child, or invalid Mount:
     `MALFORMED_SELECTED`, no fallthrough;
   - `UNKNOWN` or `CONFLICT`: propagate, no fallthrough.
5. Continue from the chosen child without backtracking if a later segment is
   absent.
6. If path segments remain and the child is FILE, return `NOT_A_DIRECTORY`.
7. If the terminal child is FILE, resolve its revision head under the active
   content Plan. A file-head tombstone permits content-plan fallthrough; a
   selected head must be a RECORD target with leaf zero and exact
   `FileRevision/1`; an Occurrence target or malformed revision blocks.

The supported B0 Plan combiners and risk-bearer rule remain unchanged. Wide
directory sorting/merging stays client-tier; Core point Lens evaluation remains
bounded at Plans 1/8/32/64.

## 5. Complete directory enumeration: BindingScope

### 5.1 Demonstrated gap

Current B0 can read a Binding head and history only after the caller knows the
BindingKey. Existing Type/backlink/Principal postings cannot prove the complete
set of name positions under one directory: they are occurrence-liveness
families, can hide withdrawn producers, and do not encode current plural-Lens
scope. A hosted index or opaque live manifest would violate independent
reconstruction.

### 5.2 Candidate generic Core delta

Add one index kind and value-key domain to a successor B0 Codex:

```text
KIND_BINDING_SCOPE      = 0x0a
DOM_VK_BINDING_SCOPE    = keccak256("efs2/vk/binding-scope/1")

scopeKey = keccak256(abi.encode(
  DOM_VK_BINDING_SCOPE,
  principalId,
  purpose,
  subject
))

postingKey = pk(0, KIND_BINDING_SCOPE, 0, scopeKey)
```

When a Binding head transitions from `UNSET` on T1 FIRST_BIND or T4
FIRST_TOMBSTONE, append the producing AdmissionOrdinal exactly once. Never
append for later rebind/tombstone, retry, failed CAS, Withdrawal, or revert.
This is a RAW_AUDIT structural anchor: it is never liveness-filtered,
decremented, or compacted. The head can never return to `UNSET`, so no extra
membership map is required.

Reuse packed postings, `PageRequest/PageResult`, and `PageCursorV1`. The cursor
already binds Realm, basis, mode, kind, and value key. The Files SDK wraps it
with the exact Files view, directory, Mount/Plan, and profile so a Core cursor
cannot be replayed into another logical listing.

`BindingScope` must exist at Realm genesis. An upgrade that begins indexing
only future mutations cannot claim complete old directories without an exact,
completeness-gated backfill transition.

### 5.3 Listing algorithm

For every unique Principal named by the active namespace Plan:

1. Page that Principal's `(name-slot purpose, directory subject)` scope at the
   exact basis.
2. Hydrate each first-mutation Binding body and recover its `fieldRole`.
3. Derive the BindingKey and read its head at the same basis.
4. If bound, hydrate the current Entry/Whiteout and verify
   `nameRole(entry.name) == fieldRole`, parent, Type, and profile.
5. Union roles across all Plan Principals.
6. Point-resolve each role through the Plan exactly as lookup does.
7. Suppress masked/absent roles, propagate malformed/unknown/conflict, and sort
   surviving names by canonical byte order.

First-tombstone anchors are valid: the anchor exposes the role; a later bound
head exposes and validates the reversible name. Churn of one name never adds a
second scope row.

`BindingScope` proves bounded progress and eventual completeness, not
answer-proportional performance after unbounded distinct-name churn. A scope
with 10,240 dead roles followed by 63 live roles may return ten empty
`PARTIAL` pages before a final complete page. Because scopes are
Principal-qualified, unrelated attackers cannot poison a trusted Plan
Principal's directory. Derived `DirectorySnapshot` manifests and local indexes
may accelerate high-churn or immutable views, but per-name Bindings remain the
sole public live authority and snapshots may never silently claim completeness
without validation against the pinned scope/view.

## 6. Exact Files views and citations

### 6.1 One-Realm atomic view

The initial Files/1 conformance slice is one Realm. A canonical view includes:

```text
FilesView {
  chainNamespace
  chainReference
  coreAddress
  realmId
  routeConfigId
  rootMountId
  filesProfileId
  blockNumber
  blockHash
  stateRoot
  executingRevisionId       // currentRevision at blockHash
  admissionHigh             // admissionCount at blockHash
  admissionBasisRevisionId  // realmBasisAt(admissionHigh)
}

FilesViewBytesV1 =
  u8 version=1 || bytes8 chainNamespace || bytes32 chainReference ||
  bytes20 coreAddress || bytes32 realmId || bytes32 routeConfigId ||
  bytes32 rootMountId || bytes32 filesProfileId || u64be blockNumber ||
  bytes32 blockHash || bytes32 stateRoot || bytes32 executingRevisionId ||
  u64be admissionHigh || bytes32 admissionBasisRevisionId

FilesViewId = H(DOM_FILES_VIEW, keccak256(FilesViewBytesV1))
```

`executingRevisionId` and `admissionBasisRevisionId` are distinct: a Realm
upgrade can occur without an admission. Pages/cursors bind the latter; code and
live interpretation bind the former.

Every historical RPC read uses EIP-1898 `blockHash`. The header number/hash and
state root, Realm identity, current revision, admission count, and
`realmBasisAt(admissionHigh)` must match. Files accepts only
`basisOrdinal == admissionHigh` observed at that block. An arbitrary ordinal
prefix is an audit view, not a filesystem snapshot: it could cut through the
sequential ordinals of one otherwise atomic multi-leaf operation.

The ChainRef/Core bytes must recompute the Realm descriptor and `realmId`.
`blockNumber` and `admissionHigh` use checked u64 conversions; overflow is a
typed `RESOURCE_LIMIT`, never truncation. The route must repeat the Realm,
root Mount, and Files profile in the view. `FilesViewBytesV1` is fixed-length,
has no ABI padding, and is the only byte form entering `FilesViewId`.

Onchain callers observe current EVM state atomically and do not manufacture a
historical FilesView mid-transaction. Offchain views materialize after a block.
Unavailable historical state yields `UNKNOWN(HISTORY_UNAVAILABLE)`, never a
latest-state fallback.

`REALM_HEAD` selects an exact current/caller-supplied block and labels it
provisional. `REALM_FINAL` does not mean “old enough” or “the RPC said final.”
It requires a separate consumer-verified `FilesFinalityReportV1` containing the
Realm's declared rule, viewed block/hash, later observation block/hash, grade,
and any required L1/finality evidence. The immutable FilesView ID does not
change when this report arrives. `NONE_DECLARED`, `SEQUENCER_SOFT`, unavailable
proofs, or an unverifiable rule yield `UNSUPPORTED`/`UNKNOWN`; under
`REQUIRE_PROVEN` they cannot be presented as final.

The portable grade codecs are derived results, not Records or new Core state:

```text
FilesFinalityReportBytesV1 =
  u8 version=1 || u8 finalityGrade || u8 ruleKind || u8 evidenceKind ||
  bytes32 filesViewId || bytes8 observationChainNamespace ||
  bytes32 observationChainReference || u64be observationBlockNumber ||
  bytes32 observationBlockHash || bytes32 proofProfileId ||
  bytes32 evidenceChunkTreeId

FilesFinalityReportId = H(DOM_FILES_FINALITY_REPORT,
                          keccak256(FilesFinalityReportBytesV1))

FilesFreshnessAssessmentBytesV1 =
  u8 version=1 || u8 freshnessGrade || u16be reservedZero ||
  bytes32 filesViewId || bytes32 freshnessPolicyId || u64be assessedAtUnix

FilesResultGradeBytesV1 =
  u8 version=1 || u8 aggregateProfileValidationGrade ||
  u8 aggregateAuthorityGrade || u8 aggregateFinalityGrade ||
  u8 freshnessGrade || bytes32 filesViewVectorHash ||
  bytes32 authorityEvidenceCommitment || bytes32 finalityReportVectorHash ||
  bytes32 freshnessAssessmentVectorHash

AuthorityEvidenceRowBytesV1 =
  bytes32 principalId || bytes32 sourceEnvelopeId || u16be sourceLeafIndex ||
  bytes32 admissionRealmRevisionId || bytes32 authorityBasisWord ||
  bytes32 authorityCodehash

authorityEvidenceCommitment = keccak256(concat(
  AuthorityEvidenceRowBytesV1 for each first-seen Object charter followed by
  selected segment/head sources in transcript order))

filesViewVectorHash = keccak256(concat(FilesViewBytesV1 in vector order))
finalityReportVectorHash = keccak256(concat(
  FilesFinalityReportBytesV1 in matching vector order))
freshnessAssessmentVectorHash = keccak256(concat(
  FilesFreshnessAssessmentBytesV1 in matching vector order))
```

The closed registries define `UNKNOWN`, `PROVISIONAL`, and `PROVEN` finality;
authority grades; evidence kinds; and `UNKNOWN`, `FRESH_AT_ASSESSMENT`, and
`STALE_AT_ASSESSMENT` freshness. Provisional/unknown report forms require every
observation/proof field that is not applicable to be zero. A proven report
must match the Realm's declared rule and exact rule-specific proof profile;
`evidenceChunkTreeId` is nonzero whenever replay needs proof bytes beyond the
named chain headers. The authority commitment uses the exact rows above; an
empty selection hashes the empty byte string. Vector hashes commit the ordered
full FilesView, finality-report, and freshness-assessment bytes.
Each aggregate grade is the registry-defined weakest grade among the evidence
actually used by the result; it may never exceed one constituent grade. The
profile aggregate follows §2.1 and is independently recomputable from the
selected dependency chain.

Freshness is explicitly an assessment, never an immutable property of a
FilesView. A later reader shows both the recorded assessment and its own
re-evaluation under the route's frozen policy. Missing/unavailable proof,
clock/head evidence, or authority history degrades to `UNKNOWN` or provisional;
it never inherits an old `PROVEN`/fresh label.

### 6.2 Cross-Realm boundary

A singular block/state basis cannot make several Realms atomic. The initial
fixture therefore treats a foreign-Realm target as an explicit external Files
link that opens a new view. A client may follow it and build a vector of view
legs, but must describe the result as cross-Realm coherent-at-declared-bases,
not atomic. Cross-Realm rename is never atomic.

Permanent same-Realm-only product scope is not adopted. The external-link
profile pins its Realm selector; a multi-leg result carries the ordered
FilesView vector, failure behavior, and cache/citation key. It never relabels
that vector as one atomic snapshot.

Every certified FilesRouter mutation is single-Realm and single-Core. A write
path that encounters `ExternalFilesLinkConfig/1` returns `UNSUPPORTED` before
signing/execution. To mutate the target, the client re-roots a separate
operation at the exact target Route/Mount; the source link is discovery, not an
atomic precondition. Create, edit, unlink, copy, and rename may not claim
certification across view legs.

### 6.3 Friendly discovery and exact citation

`web3://efs.eth/path` is a friendly live route. ENS resolver state,
content-contract selection, gateway address/mode, and current route config are
discovery authority. They may change.

An exact citation uses a direct chain/contract/Realm route plus:

- the ordered canonical FilesView vector (one element for same-Realm paths);
- canonical path bytes and parser/profile versions;
- root and every entered Mount/Plan;
- per-segment selected Principal, Binding position/head revision, target
  Record, and result;
- terminal directory or File Object;
- terminal FileRevision and ChunkTree when a file is present;
- ordered authority evidence, one finality report per FilesView, and recorded
  freshness assessment under the Route policy;
- exact outcome and canonical resolution transcript hash.

The candidate direct locator is ASCII and unambiguous:

```text
web3://0x<40-lowercase-hex-adapter>:<canonical-decimal-chainId><canonical-absolute-path>
  ?efs-control=v1.c.<unpadded-base64url(FilesExactControlV1)>

FilesExactControlV1 =
  u8 version=1 ||
  bytes8 chainNamespace=0x6569703135350000 ||
  bytes32 chainReference=uint256be(chainId) ||
  bytes20 adapter || bytes20 core ||
  bytes32 realmId || bytes32 blockHash || bytes32 routeConfigId ||
  bytes32 canonicalPathHash || bytes32 applicationQueryHash ||
  bytes32 transcriptChunkTreeId || bytes32 transcriptId

transcriptId = H(DOM_FILES_TRANSCRIPT, keccak256(transcriptBytes))
```

`chainId` is nonzero unsigned decimal with no leading zero; address hex is
lowercase and exactly 20 bytes. `efs-control` is the first query pair and occurs
exactly once. Canonically serialized application query pairs may follow in
their preserved order; their bytes are committed by `applicationQueryHash`.
An exact citation has no fragment. URL adapter/chain/path, control fields,
route/Core/Realm reads, and transcript must all agree.
The exact form forbids ENS names, `w3` shorthand, userinfo, an omitted/default
chain, and any alternate authority spelling; those remain friendly discovery
inputs and can only produce a separately retained discovery receipt.

`transcriptBytes` is exactly:

```text
u8 version=1 || u8 transcriptMode || u8 viewCount || u8 rootViewIndex=0 ||
repeat(FilesViewBytesV1 || FilesFinalityReportBytesV1 ||
       FilesFreshnessAssessmentBytesV1) ||
FilesResultGradeBytesV1 || bytes32 routeConfigId ||
u32be canonicalPathLen || canonicalPathBytes ||
u16be segmentCount || bytes32 rootMountDescriptorId ||
repeat(
  u16be nameLen || nameBytes || u8 lookupViewIndex || bytes3 reservedZero ||
  bytes32 lookupMountDescriptorId || bytes32 namespacePlanId ||
  u8 selectedAuthorityGrade || u8 selectedProfileValidationGrade ||
  bytes2 reservedZero ||
  bytes32 selectedPrincipalId || bytes32 positionKey || bytes32 bindingKey ||
  u32be bindingRevision || bytes32 sourceEnvelopeIdOrZero ||
  u16be sourceLeafIndex || u8 targetKind || bytes32 targetA ||
  u16be targetLeaf || u16be resultCode ||
  u8 enteredViewIndexPlus1 || bytes3 reservedZero ||
  bytes32 enteredMountDescriptorIdOrZero
) ||
u8 terminalKind || u8 terminalViewIndexPlus1 || u16be reservedZero ||
bytes32 terminalMountDescriptorIdOrZero || bytes32 terminalObjectId ||
bytes32 terminalContentPlanIdOrZero ||
u8 terminalAuthorityGrade || u8 terminalProfileValidationGrade ||
bytes2 reservedZero ||
bytes32 terminalSelectedPrincipalIdOrZero ||
bytes32 terminalPositionKeyOrZero || bytes32 terminalBindingKeyOrZero ||
u32be terminalBindingRevision || bytes32 terminalSourceEnvelopeIdOrZero ||
u16be terminalSourceLeafIndex || u8 terminalTargetKind ||
bytes32 terminalTargetAOrZero || u16be terminalTargetLeaf ||
bytes32 fileRevisionIdOrZero || bytes32 chunkTreeIdOrZero ||
u16be terminalResultCode
```

`transcriptMode` is `1=PATH` or `2=DIRECT_ID`. `viewCount` is `1..65`; every
fixed-length view and immediately following report/assessment validates independently,
and every index is in range. View zero equals the direct URL/control root.
Further views occur in first-entry order, with no duplicate or unused view;
re-entry reuses the existing index. Root plus 64 external transitions therefore
fits without lowering the advertised mount-transition floor.

For every segment, lookup context is distinct from entered context. A selected
entry has `enteredViewIndexPlus1=index+1` and a nonzero entered Mount; the next
segment's lookup pair must equal that entered pair. No entered context uses
zero plus an all-zero Mount. Same-mount and same-Realm transitions still repeat
the exact pair. A terminal present result carries its effective view+1 and
Mount; terminal file-head authority is resolved only there, never in the
source lookup view. External transitions must cross-check their selected link,
target descriptor, Route, view, and root Object.

Canonical result tables define all presence/zero rules. A lookup always carries
its position. `BOUND`/`MASKED` carries selected Principal/grade, BindingKey,
revision, source Occurrence, and target; absence/conflict/unknown carries no invented selection.
Only a valid selected DirectoryEntry carries entered context. A present
directory has terminal view/Mount/Object and zero content-head fields. A
present file additionally has content Plan, selected authority/Principal,
Binding position/key/revision, RECORD leaf-zero target, FileRevision, and
ChunkTree. Every non-present terminal zeroes fields that the result does not
define. Selection and terminal profile-validation grades must aggregate exactly
into `FilesResultGradeBytesV1`. Unknown kinds/codes, inconsistent grades,
nonzero reserved/absent
fields, and trailing bytes reject.

All counts/lengths are canonical big-endian and names obey their existing
bounds. In PATH mode, `canonicalPathBytes` and `segmentCount` match the URL and
rows exactly. The named `ChunkTree` commits these bytes;
`canonicalPathHash=keccak256(canonicalPathBytes)`. In DIRECT_ID mode,
`canonicalPathLen=0`, `segmentCount=0`, `viewCount=1`, and the terminal must be
a present object matching the direct control; no path transcript is implied.

The direct-ID form is exactly
`web3://0x<adapter>:<chainId>/?efs-control=v1.d.<base64url>` with no other path
segments and this payload:

```text
FilesDirectControlV1 =
  u8 version=1 || bytes8 chainNamespace || bytes32 chainReference ||
  bytes20 adapter || bytes20 core || bytes32 realmId || bytes32 blockHash ||
  bytes32 routeConfigId || bytes32 filesViewId ||
  bytes32 mountDescriptorId || bytes32 objectId ||
  bytes32 applicationQueryHash || bytes32 transcriptChunkTreeId ||
  bytes32 transcriptId
```

Its full FilesView must occur in and match the transcript vector; the named
Mount/Object must equal the terminal result. Thus a path too long for a URL or
host remains shareable without inventing a second identity. The freeze bundle
pins both binary codecs, result/code tables,
base64url without padding, domain hashes, pair ordering/exclusivity, and golden
vectors including chain/address/path/control mismatch rejection.

The transcript bytes must be available from the named commitment or
reproducible by replay; a bare opaque hash is not proof. A discovery receipt is
mandatory when claiming what `efs.eth` resolved to at an ENS basis, but is not
part of a direct-address citation. Later ENS repointing does not alter the
exact citation.

An ordinary current-state ERC-5219 `request()` cannot honor an arbitrary
historical block merely because a query parameter contains it. Exact historical
citations require an EFS-aware client using block-hash-pinned calls or a
complete proof/reconstruction. The generic route remains a live/current
convenience.

## 7. File bytes and retrieval

### 7.1 Identity separation

```text
File Object          stable human/logical identity
FileRevision Record  immutable generation + history + metadata
ChunkTree Record     exact byte commitment and range geometry
Locator Record       authored claim about where committed bytes may be
```

One file-head Binding atomically selects content and generation metadata by
targeting one FileRevision. Size is derived from the ChunkTree. Whole-file
foreign digests remain `ByteDigest/1` plus `RepresentationBinding/1`; they do
not duplicate or replace EFS content identity.

### 7.2 Canonical empty bytes

Before any ceremony-final Type bytes are minted, correct the current
`ChunkTree/1` profile in place to permit exactly one empty form:

```text
chunkSize  = CHUNK_SIZE_DEFAULT
chunkCount = 0
totalSize  = 0
merkleRoot = keccak256(0x02)  // reserved empty-tree tag
```

No other zero-count/zero-size combination is valid. Empty bytes need no chunk
proof or Locator; `(offset=0,length=0)` succeeds and every nonempty range is
EOF. Nonempty trees retain the existing leaf/node algorithm and bounds. Because
v2 has no frozen production bytes, this avoids a casual `ChunkTree/2` that
would force versioning `Locator/1`, `RepresentationBinding/1`, and
`AvailabilityObservation/1` merely to admit the new target Type.

### 7.3 Acquisition

For a requested range:

1. Enumerate admissible Locator/evidence candidates under the client's bounded
   transport policy, separately from content-head authority.
2. Fetch every intersecting full chunk plus proof.
3. Verify geometry, leaf hash, path, and ChunkTree root before releasing bytes.
4. Slice only after verification.
5. Reject corrupt candidates and try another. Independently verified chunks
   may come from different carriers.
6. A whole-file-hash-only carrier must fetch and verify the complete file before
   serving a late range.

No usable carrier is `BYTES_UNAVAILABLE`, not path absence. Incomplete Locator
enumeration is `UNKNOWN/PARTIAL`, never proof that no carrier exists. A generic
ERC-5219 `message/external-body` response names transport; it is not
`BYTES_VERIFIED` for arbitrary URLs. The Web Client/OS/mount performs EFS
verification and fallback.

An open file handle pins `(FilesView, effectiveMount, File Object,
FileRevision, ChunkTree)`. A later head change affects a new open, not an
existing handle.

### 7.4 Retrieval observers and interest privacy

Integrity, authority, completeness, availability, and lookup privacy are
separate result axes. Every resolver/acquisition plan previews likely
observers, and every completed attempt returns a local derived report:

```text
RetrievalPrivacyReportBytesV1 =
  u8 version=1 || u8 retrievalMode || u8 outcome || u8 observerCount ||
  repeat(u8 observerClass || u8 transportProtection || u16be reservedZero ||
         u32be disclosedFieldMask || bytes32 endpointFingerprint)

RetrievalPrivacyReportId = H(DOM_FILES_RETRIEVAL_PRIVACY,
                             keccak256(RetrievalPrivacyReportBytesV1))
```

`observerCount` is `0..16`. Closed modes/classes distinguish local replica,
raw RPC, path-aware gateway, direct carrier, snapshot/proof provider, OHTTP or
other audited relay, and mixed fallback. Disclosure bits separately cover
host/path/name bytes, hashed Binding/query keys, Record/Occurrence IDs,
ChunkTree/chunk/range IDs, client network address, and authentication tokens.
`endpointFingerprint` hashes the canonical origin/service identity; sensitive
local details may be shown only through the local control channel, while the
observer class and disclosure mask remain visible.

TLS authenticates/encrypts transport but does not make the endpoint oblivious.
OHTTP/onion/relay claims require the exact measured transport profile; a proxy
label alone is insufficient. `LOCAL_REPLICA` describes this lookup only and
does not erase observers of the earlier sync. A missing report is
`PRIVACY_UNKNOWN`, never “private.” Web/OS and mount control expose planned and
actual reports beside byte-integrity and finality grades. Access to an opaque
private Mount can still leak boundary interest unless its separate privacy
profile proves otherwise.

### 7.5 Rendering is not authority

Byte verification never grants origin or execution authority. HTML, SVG, PDF,
XML, scripts, and other active formats selected below `efs.eth` render only in
a sandboxed opaque origin with no inherited credentials, service-worker scope,
wallet/provider, network, storage, or ambient EFS capabilities. Default/raw
delivery is attachment plus `X-Content-Type-Options: nosniff`; MIME, extension,
and `executableHint` never opt a file into the trusted route origin. An explicit
Preview/Play action may grant a separately reviewed runner capability only
after required closure verification.

## 8. Namespace and file mutation

### 8.1 Operation shapes

All application Records precede Binding leaves that target them in selected
leaf order.

| Operation | Atomic semantic unit |
|---|---|
| Create file | ObjectGenesis + publisher-charter bind + ChunkTree + initial FileRevision + DirectoryEntry + file-head bind + name-slot bind |
| Create empty directory | ObjectGenesis + publisher-charter bind + DirectoryEntry + name-slot bind |
| Edit file | ChunkTree + FileRevision + file-head CAS rebind |
| Rename/move | destination DirectoryEntry + source DirectoryWhiteout + destination/source CAS binds |
| Unlink/mask | DirectoryWhiteout + name-slot CAS bind |
| Stop claiming | BindingTombstone; permits lower-tier fallthrough |
| Copy | new File Object + publisher-charter bind + initial FileRevision, optionally sharing ChunkTree + new placement/head binds |
| Additional hard placement | new DirectoryEntry + name-slot bind to the same File Object |

Rename/move is O(1) in subtree size because child and descendant Object IDs do
not contain path names. Unlink removes a placement from the resolved view; it
does not destroy Records or bytes. Rebinding a former revision is a fresh
Binding occurrence, never resurrection of an old withdrawn head.

### 8.2 FilesRouter

Core `expectedRevision=0` proves only that one Principal's BindingKey is unset.
It does not prove that a destination is absent across the effective namespace
Plan. Filesystem `O_EXCL`, `NOREPLACE`, overwrite, unlink, and move therefore
need a non-Core `FilesRouter` plus one generic successor consent seam.

Current B0 `AdmissionIntent/1` is bearer authorization to Core. It does not
name an executor or commit to the complete routed operation. Consequently, a
coordinator or mempool observer can submit one otherwise valid Envelope
directly to Core, bypassing Router preconditions; with several Principals it
can also submit only a subset. An outer EVM transaction cannot repair consent
that was never bound to that transaction path. No `/1` operation may be
reported as `FILES_PRECONDITION_CERTIFIED`.

The candidate generic successor uses a distinct name because B0 reserves
`AdmissionIntent/2` for a future wider leaf selector:

```text
RoutedAdmissionIntent/1 = AdmissionIntentCoreFields ||
                          executor bytes20 ||
                          executorCodeHash bytes32 ||
                          operationRecordId bytes32

Core rules:
  msg.sender == address(executor)
  extcodehash(address(executor)) == executorCodeHash
  operationRecordId is nonzero and names a state-readable materialized Record
                    in this Realm; Core does not inspect its application Type
```

`AdmissionIntentCoreFields` is exactly the existing signed Realm, Envelope,
leaf mask, action, expected-revision vector, nonce lane/value, and expiry
payload. The signed commitment is exact:

```text
ROUTED_INTENT_TYPESTRING =
  "RoutedAdmissionIntent(bytes32 realmId,bytes32 envelopeId,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter,bytes20 executor,bytes32 executorCodeHash,bytes32 operationRecordId)ExpectedRevision(uint16 leafIndex,uint32 revision)"
ROUTED_INTENT_TYPEHASH = keccak256(bytes(ROUTED_INTENT_TYPESTRING))
routedStructHash = keccak256(abi.encode(
  ROUTED_INTENT_TYPEHASH, realmId, envelopeId, leafMask, action,
  expectedRevisionsHash, nonceKey, nonceSeq, notAfter,
  executor, executorCodeHash, operationRecordId))
DS_ROUTED = keccak256(abi.encode(
  EIP712_DOMAIN_TYPEHASH, keccak256("EFS2-RoutedAdmissionIntent"),
  keccak256("1"), chainId, verifyingContract))
routedDigest = keccak256(0x1901 || DS_ROUTED || routedStructHash)
```

`EXPECTED_REVISION_TYPEHASH` and `expectedRevisionsHash` are byte-identical to
B0 AdmissionIntent/1. The freeze corpus also mints
`DOM_ROUTED_INTENT=keccak256("efs2/routed-admission-intent/1")` and
`RoutedIntentId=keccak256(abi.encode(DOM_ROUTED_INTENT,routedDigest))`.

The successor Core ABI does not guess a consent type from opaque bytes. Its
single `publish` primitive adds `uint8 consentKind` before `consentBytes`, with
closed values `0=IMPLICIT_SENDER`, `1=ADMISSION_INTENT_V1`, and
`2=ROUTED_ADMISSION_INTENT_V1`. Kind 0 keeps B0's exact leaf-mask-only branch;
kind 1 decodes only `AdmissionIntent/1`; kind 2 decodes only the structure
above. Unknown kinds, a structurally valid payload under the wrong kind, and
zero/mixed routed fields reject. This is a pre-freeze ABI successor, not a
second Core write facade or an auto-detected wire alias.

```solidity
function publish(
    bytes calldata envelopeBytes,
    AccountPrincipal calldata principal,
    uint8 consentKind,
    bytes calldata consentBytes,
    bytes calldata consentWitness
) external returns (PublishResult memory);
```

Before mutation signing, any party admits this author-neutral operation Record.
That preparation is not filesystem authority; each participating Principal's
later routed signature is authority. Pre-admission breaks the identity cycle:
the exact mutation Envelope IDs are known when the operation Record is minted,
while those Envelopes do not contain the operation Record.

This is the generic Core boundary: another immutable router may use another
operation Type. The selected `FilesRouter`, not Core, requires the named Record
to be exactly `FilesOperation/1`, decodes its frame, and cross-checks its route,
intents, and conditions before the first publish.

```text
FilesOperation/1 {
  frame BYTES(maxLen = MAX_FILES_OPERATION_FRAME_BYTES = 7,680)
}

FilesOperationFrameV1 {
  u8 version = 1
  u8 operationKind
  u8 intentCount                 // 1..8
  u8 preconditionCount           // 1..16
  u8 postconditionCount          // 1..16
  u8 sourceSegmentCount
  u8 destinationSegmentCount
  u8 reservedZero
  bytes32 routeConfigId
  bytes32 preflightFilesViewId   // audit provenance, not inclusion-block equality
  bytes32 expectedRealmRevisionId
  sourcePathSegments[]
  destinationPathSegments[]
  orderedIntentSpecs[]
  preconditions[]
  postconditions[]
}

PathSegmentV1 = u16be nameLen || nameBytes

RoutedIntentSpecV1 =
  bytes32 principalId || bytes32 envelopeId || u64be leafMask ||
  u8 action || u8 expectedRevisionCount || bytes24 nonceKey ||
  u64be nonceSeq || u64be notAfter ||
  repeat(u16be leafIndex || u32be expectedRevision)

FilesConditionV1 =
  u8 conditionKind || u8 reservedZero || u16be resultCode ||
  bytes32 conditionResultCommitment

FilesConditionResultBytesV1 =
  u8 version=1 || u8 conditionKind || u16be resultCode ||
  u8 segmentCount || u8 aggregateProfileValidationGrade ||
  u16be reservedZero ||
  bytes32 routeConfigId || bytes32 expectedRealmRevisionId ||
  bytes32 rootMountDescriptorId ||
  repeat(bytes32 lookupMountDescriptorId || bytes32 planId ||
         u8 selectedProfileValidationGrade || bytes3 reservedZero ||
         bytes32 selectedPrincipalId || bytes32 positionKey ||
         bytes32 bindingKey || u32be bindingRevision ||
         bytes32 sourceEnvelopeIdOrZero || u16be sourceLeafIndex || u8 targetKind ||
         bytes32 targetA || u16be targetLeaf || u16be segmentResultCode ||
         bytes32 enteredMountDescriptorIdOrZero) ||
  u8 terminalKind || u8 terminalProfileValidationGrade ||
  u16be reservedZero || bytes32 terminalMountDescriptorIdOrZero ||
  bytes32 terminalObjectId ||
  bytes32 terminalContentPlanIdOrZero ||
  bytes32 terminalSelectedPrincipalIdOrZero ||
  bytes32 terminalPositionKeyOrZero || bytes32 terminalBindingKeyOrZero ||
  u32be terminalBindingRevision || bytes32 terminalSourceEnvelopeIdOrZero ||
  u16be terminalSourceLeafIndex || u8 terminalTargetKind ||
  bytes32 terminalTargetAOrZero || u16be terminalTargetLeaf ||
  bytes32 fileRevisionIdOrZero || bytes32 chunkTreeIdOrZero

conditionResultCommitment = keccak256(FilesConditionResultBytesV1)
```

Source segments precede destination segments; intent, precondition, and
postcondition rows retain their declared order. Source plus destination has at
most 64 segments and 4,096 name bytes. Across all intents there are at most 64
selected leaves and 64 expected-revision rows. Envelope IDs are unique across
intent specs, so selected `(EnvelopeId,leafIndex)` occurrences are globally
disjoint. Every leaf-mask bit is in the named Envelope, `action=0`, expected revisions are strictly leaf-index ordered
and exactly associated as in B0, every nonce field is canonical, and every
Principal equals the authenticated Envelope Principal. The closed operation-
and-condition-kind registry specifies which source/destination paths and
result codes each operation requires. Unknown kinds, zero masks, duplicate
rows, nonzero reserved bytes, trailing bytes, and mismatched counts reject.

The exact worst-case frame is bounded independently of calldata: the 104-byte
header + 4,224 path bytes (including length prefixes) + 912 fixed intent bytes
+ 384 expected-revision bytes + 1,152 condition bytes = 6,776 bytes, below
`MAX_FILES_OPERATION_FRAME_BYTES=7,680`; the containing MC/1 body remains below
8,192 bytes. Each condition selects the source or destination path by its
closed kind and commits the complete semantic dependency chain. It deliberately
omits FilesView/block/admission-high: those belong to `preflightFilesViewId`
audit provenance, while every relevant Mount, Plan, selected Principal,
BindingKey/revision/target, terminal Object/revision/content, Realm revision,
and result is committed explicitly. The Router recomputes these bytes from
current state at the grade its immutable runtime can prove. Full Files
certification requires the aggregate and every relevant per-component grade to
be `FILES_PROFILE_VALIDATED`; otherwise the Router returns
`UNSUPPORTED(PROFILE_VALIDATION)` before the first Core call. A relevant change
fails even if the human-readable path is
unchanged; unrelated blocks/admissions do not fail an operation.

Every participating Principal signs a `RoutedAdmissionIntent/1` with the same
exact Router address/code hash and `operationRecordId`.
`preflightFilesViewId` records what the signer reviewed; the Router does not
require a future inclusion block to equal that historical block. Instead the
operation commits the Realm revision and exact dependency/result expectations. At
execution, the Router evaluates them against current EVM state; any relevant
intervening change fails. `FilesRoute.writeRouter` and
`writeRouterCodeHash` pin that executor and its immutable runtime. The accepted
Router profile forbids proxy/delegatecall/state-selected implementation
dispatch; its reviewed runtime has no reachable `DELEGATECALL`, `CALLCODE`, or
`SELFDESTRUCT`, no mutable configuration that changes pre/postcondition
semantics, and no external execution dependency other than reads/calls to the
exact route Core. Append-only receipt state and a reentrancy guard are not
dispatch authority. Core, not the Router, enforces the signed `extcodehash` on
every routed publish.

For every accepting routed batch, Core persists and exposes:

```text
RoutedConsentMetaV1 {
  intentProfileVersion u16
  executor bytes20
  executorCodeHash bytes32
  operationRecordId bytes32
}
```

The public getter is exactly
`routedConsentMeta(uint64 batchId) -> (bool routed, uint16
intentProfileVersion, bytes20 executor, bytes32 executorCodeHash, bytes32
operationRecordId)`. `routed=false` requires every returned field zero. It is
part of the Realm reconstruction ABI and uses no log or calldata fallback.
The operation Record plus accepted batches reconstruct the exact routed EIP-712
digest and the historical acceptance verdict. As with B0 authority receipts,
the signature/contract witness itself is not retained or replayed against
mutable present authority; the accepting batch's recorded authority basis is
the canonical verdict.

The Router appends one immutable, enumerable `FilesOperationReceiptV1` only
after every postcondition passes, binding the operation Record, route, Realm,
ordered batch IDs, execution block, and exact pre/post result commitments. A
clean reader can therefore reconstruct the signed consent, exact operation,
constituent Core batches, and certification without logs, calldata archives,
or present Router-state guesses. The exact receipt codec is:

```text
FilesOperationReceiptBytesV1 =
  u8 version=1 || u8 batchCount || u8 certificationGrade=1 ||
  u8 aggregateProfileValidationGrade=FILES_PROFILE_VALIDATED ||
  bytes32 operationRecordId || bytes32 routeConfigId || bytes32 realmId ||
  bytes32 expectedRealmRevisionId || u64be preAdmissionHigh ||
  u64be postAdmissionHigh || u64be executionBlockNumber ||
  bytes32 preconditionsHash || bytes32 postconditionsHash ||
  repeat(u64be batchId)

receiptId = H(DOM_FILES_OPERATION_RECEIPT,
              keccak256(FilesOperationReceiptBytesV1))
```

`batchCount` is `1..8` and equals `intentCount`. On a first execution every
selected occurrence must be fresh and each intent produces exactly one batch;
an all-ACTIVE operation is handled only by the completed-receipt retry path.
`certificationGrade=1` is the closed `FILES_PRECONDITION_CERTIFIED` value. No
other value is valid in `/1`, and the receipt's profile grade must be exactly
`FILES_PROFILE_VALIDATED`; the condition rows must recompute to that same
weakest grade. A structural-only Router evaluation appends no receipt and
returns `UNSUPPORTED(PROFILE_VALIDATION)`.
Batch IDs are strictly consecutive in intent order. Their admission ranges are
contiguous, `preAdmissionHigh = firstBatch.firstOrdinal - 1`, and
`postAdmissionHigh = lastBatch.firstOrdinal + lastBatch.acceptedCount - 1`;
each accepted count equals `popcount(intent.leafMask)` and the ranges cover
exactly `(preAdmissionHigh,postAdmissionHigh]`. Every named batch has identical
routed consent metadata and the accepting block/revision and appears once.

The hashes are exact:

```text
preconditionsHash = keccak256(concat(
  conditionResultCommitment for precondition rows in operation order))
postconditionsHash = keccak256(concat(
  conditionResultCommitment for postcondition rows in operation order))
```

Each element is one 32-byte word; neither list is empty. `executionBlockNumber`
is the accepting block with a checked u64 conversion; its block hash is read
from the named chain rather than guessed during EVM execution. The Router ABI
is exactly `operationReceiptCount() -> uint64`,
`operationReceiptIdAt(uint64 ordinal) -> bytes32`,
`operationReceipt(bytes32 receiptId) -> bytes`, and
`operationReceiptFor(bytes32 operationRecordId) -> (bool exists, bytes32
receiptId)`. Ordinals are append-only, the operation lookup is single-assignment,
and unknown IDs/ordinals reject instead of returning an all-zero pseudo-receipt.
The guarded u64 receipt ordinal and execution-block conversion are preflighted
before the first Core call; exhaustion returns a typed error with zero writes.

A clean reader folds the Realm's append-only state to `preAdmissionHigh` and
`postAdmissionHigh`, verifies that both are complete batch/operation
boundaries, recomputes every full `FilesConditionResultBytesV1` at the
respective boundary, and checks the row commitments and aggregate hashes. These
are explicitly operation-audit boundaries, not user-facing FilesViews; no
mid-batch prefix may be presented as a filesystem snapshot. Missing historical
state yields `UNKNOWN(HISTORY_UNAVAILABLE)`, never a guessed preimage.

The Router:

1. Pins immutable route, Mount, namespace/content Plan IDs, and current Realm
   state.
2. Resolves effective source/destination before writes.
3. Loads and decodes the exact operation Record; verifies its ordered intent
   set, signer/Principal association, and operation-specific preconditions
   across the whole Plan.
4. Executes every committed routed intent in order inside one outer EVM
   transaction. Core independently enforces sender and runtime code hash and
   retains the consent metadata.
5. Checks every committed effective postcondition.
6. Appends the immutable operation receipt, or reverts the entire transaction
   on any failed signature, expiry, nonce, CAS, validation, or postcondition.

Exact retry is association-preserving. Before Core's all-ACTIVE shortcut, a
routed retry verifies that every selected existing occurrence's accepting
batch has identical `RoutedConsentMetaV1`; any unrouted or differently routed
occurrence fails `E_ROUTED_ASSOCIATION` without writes. A completed Router call
returns its prior operation receipt and does not rerun preconditions or append
state. An uncompleted operation cannot adopt pre-existing effect occurrences
from unrelated calls. Operation Record bytes remain state-readable after their
preparatory admission; later carriage Withdrawal does not erase the signed
participants' reference or the accepted-batch association.

The EVM transaction serializes competing writers between preflight and commit.
Same-Principal operations normally fit one Envelope but still require routed
consent if the result claims Router-certified view-level preconditions.
Cross-Principal rename requires the complete set of independently signed
routed intents; without it the product can offer only a separately authorized
link followed by a later unlink, never an atomic rename. Direct Core
publication remains valid generic state but cannot claim POSIX/view-level
`O_EXCL`, `NOREPLACE`, overwrite, or rename certification.

The Router rejects any pre/postcondition traversal that enters an external
view leg. Same-Realm Mount overrides remain legal; cross-Realm mutations must
start from a separately selected target Route as specified in §6.2.

Omitting, reordering, replacing, or directly submitting any committed intent
fails before durable state. Copying the entire Router transaction may change
the payer but not the authorized operation; nonce/CAS and exact retry rules
deduplicate it. The freeze gate includes direct-submit, omitted-intent,
reordered-intent, split-bundle, copied-transaction, reentrancy, and front-run
falsifiers. `RoutedAdmissionIntent/1` plus retained consent metadata are a
generic B0-successor proposal, not a Files-only Core callback and not an
adopted protocol change.

No current operation approaches the 64-leaf structural cap, but the integrated
Core + `BindingScope` + worst-case name/parents/Plan gas and wire bytes must be
measured. Contract size is a stronger risk than Files leaf count, so path
traversal and profile validation remain outside the Core monolith.

## 9. Result and HTTP semantics

Canonical APIs preserve at least:

```text
PRESENT_FILE
PRESENT_DIRECTORY
ABSENT_PROVEN
MASKED
NOT_A_DIRECTORY
NO_CURRENT_VERSION
CONFLICT
UNKNOWN
PARTIAL
MALFORMED_SELECTED
UNSUPPORTED
RESOURCE_LIMIT
LOOP
ACCESS_REQUIRED / OPAQUE
BYTES_UNAVAILABLE
BYTE_INTEGRITY_FAILURE
RANGE_NOT_SATISFIABLE
PROJECTION_COLLISION
UNSUPPORTED_HOST_PATH
```

Only `ABSENT_PROVEN` or an intentionally hidden `MASKED` result may project to
ordinary `404`/`ENOENT`. `UNKNOWN`, incomplete pages, unavailable history, or
missing bytes never populate a negative cache.

Suggested Files gateway mapping:

| Result | HTTP |
|---|---:|
| Present file/directory | 200 |
| Valid verified range | 206 plus exact `Content-Range` and `Accept-Ranges: bytes` |
| Unsatisfiable range on known verified size | 416 plus `Content-Range: bytes */<size>` |
| Proven absent; masked for ordinary public callers | 404 |
| Bad path/control encoding | 400 |
| Access required / denied | 401 / 403 |
| Conflict, not-a-directory, or entry with no current FileRevision | 409 |
| Raw serialized request-target exceeds the advertised transport cap | 414 |
| Malformed selected authenticated object or corrupt upstream bytes | 502 |
| Unknown, partial, unavailable history/carrier, or non-URL resource budget | 503 |
| Unsupported profile or contract path | 501 |
| Cycle | 508 |

This is the EFS-native/HTTP-gateway mapping, not a claim that every body fits
the Final ERC-5219 `string body`. The 5219 compatibility adapter returns text
or `message/external-body`; arbitrary verified binary and resumable range
results use the EFS-native `bytes` result ABI or an explicitly tested chunked
transport.
Decoded semantic depth/evaluation/RPC/memory/wall-time exhaustion remains
`RESOURCE_LIMIT`/503; only the raw serialized request-target transport limit
maps to 414.

Machine responses carry the canonical result, reason, full relevant FilesView
vector, `FilesResultGradeBytesV1`, profile-validation grade, authority evidence
commitment, finality
report IDs/proof profiles, and recorded/current freshness assessments.
`UNKNOWN`, `PARTIAL`, `BYTES_UNAVAILABLE`, and every 5xx response use
`Cache-Control: no-store`. Friendly live responses revalidate against ENS,
route-config, FilesView, and selected-head changes. An exact citation may be
immutable only when its view, transcript, selected revision, representation,
and returned bytes are all exact. A strong ETag hashes the exact returned
representation after any content encoding; FileRevision and ChunkTree IDs are
separate `EFS-Revision` and `EFS-Content` metadata and are not silently reused
as a representation ETag.

The direct ChunkTree byte/range profile freezes `Content-Encoding: identity`.
Its strong ETag names the complete selected byte representation and is
identical on 200 and every 206 slice; it never hashes only the returned range.
If a gateway wants gzip/Brotli or another encoded byte space, that exact encoded
representation must have its own committed bytes/validator and Range geometry.
An ambient transfer encoding may not change offsets under the identity ETag.

Read-only host adapters preserve the same distinctions:

| Canonical result | POSIX projection | Windows/WinFsp projection |
|---|---|---|
| `ABSENT_PROVEN`, publicly hidden `MASKED` | `ENOENT` | `STATUS_OBJECT_NAME_NOT_FOUND` |
| `NOT_A_DIRECTORY` | `ENOTDIR` | `STATUS_NOT_A_DIRECTORY` |
| `LOOP` | `ELOOP` | `STATUS_REPARSE_POINT_NOT_RESOLVED` |
| `ACCESS_REQUIRED` / denied | `EACCES` | `STATUS_ACCESS_DENIED` |
| host component/path cannot project | `ENAMETOOLONG` or `ENOTSUP` | `STATUS_NAME_TOO_LONG` or `STATUS_NOT_SUPPORTED` |
| `UNSUPPORTED` | `ENOTSUP` | `STATUS_NOT_SUPPORTED` |
| `RESOURCE_LIMIT` | `EAGAIN`, `EOVERFLOW`, or `ENAMETOOLONG` by cause | `STATUS_RETRY`, `STATUS_INTEGER_OVERFLOW`, or `STATUS_NAME_TOO_LONG` |
| `PROJECTION_COLLISION` | `EIO` | `STATUS_OBJECT_NAME_COLLISION` |
| attempted mutation | `EROFS` | `STATUS_MEDIA_WRITE_PROTECTED` |
| `UNKNOWN` / `PARTIAL` / unavailable history | `EAGAIN`, `ETIMEDOUT`, or `EIO` by cause | `STATUS_DEVICE_NOT_READY`, `STATUS_IO_TIMEOUT`, or `STATUS_IO_DEVICE_ERROR` |
| `NO_CURRENT_VERSION`, `CONFLICT`, `MALFORMED_SELECTED`, unavailable/corrupt bytes | `EIO` | `STATUS_FILE_INVALID` or `STATUS_FILE_CORRUPT_ERROR` |

No timeout or incomplete result becomes `ENOENT`, and no such result enters a
negative name cache.

## 10. Host projection

EFS names remain rich and case-sensitive. Linux/macOS/Windows limitations are
projection constraints, not identity rules.

`CommonHostAlias/1` gives all three required adapters the same deterministic
projection. A canonical name is emitted directly only when it:

- is lowercase ASCII `[a-z0-9._-]+`;
- is neither `.` nor `..`, contains no separator, and does not begin `~efs~`;
- has no trailing dot/space and no Windows device-name base (`con`, `prn`,
  `aux`, `nul`, `com1`..`com9`, `lpt1`..`lpt9`, with or without extension);
- is within the profile's 255-byte component cap; and
- does not collide under the host comparator with another projected sibling.

Every other name uses lowercase RFC 4648 base32 without padding:

```text
reversible = "~efs~n-" || base32(canonicalNameBytes)
digest     = "~efs~h-" || base32(H(DOM_FILES_HOST_ALIAS,
                                      canonicalNameBytes))
```

Use `reversible` when it fits the component cap; otherwise use the complete
256-bit `digest`. A real EFS name beginning `~efs~` is itself aliased. Alias
every member of any residual host-comparator collision class, not whichever
member was enumerated first. Detect a digest or projected-name collision and
fail `PROJECTION_COLLISION`; never append an unstable counter.

The authoritative reverse map is canonical `DirectoryProjectionV1` bytes
sequence, sorted by canonical name bytes:

```text
u8 version=1 || bytes32 filesViewId || bytes32 mountDescriptorId ||
bytes32 directoryNodeId || bytes32 aliasProfileId ||
u32be entryCount ||
repeat(u16be nameLen || name || u16be aliasLen || aliasASCII ||
       bytes32 entryRecordId || bytes32 nodeId ||
       bytes32 selectedPrincipalId || u32be nameBindingRevision)

DirectoryProjectionId = H(DOM_FILES_DIR_PROJECTION,
                          keccak256(projectionBytes))
```

Lengths/counts are canonical unsigned big-endian with no alternate width;
`nameLen` is 1..255 and `aliasLen` is 1..255 in the common profile. The
Binding revision is the exact B0 public `u32`, not an invented digest.
If the complete effective directory contains more than `2^32-1` entries, the
projection/listing returns `RESOURCE_LIMIT(DIRECTORY_CARDINALITY)` and no
partial `DirectoryProjectionV1`; known-name point lookup remains available.

The complete directory must resolve before this table is final. It is bound to
the exact FilesView and generation; a stale table never decodes a newer alias.
An incomplete directory is I/O/retry, not a partial native folder. Xattrs/EAs
are diagnostics and discovery aids, never the sole reverse map.

Canonical Node identity, path-specific Entry identity, selected Revision, and
adapter-local HostFileId are separate. A read-only common mount need not expose
native hard links; it may report `nlink=1` while exposing NodeId through the
lossless control API. Open file and directory handles pin their view/generation.
Overlong host paths return `UNSUPPORTED_HOST_PATH` and remain reachable through
the direct-ID/control API.

```text
rootPlacementId = H(DOM_FILES_ROOT_PLACEMENT,
                    routeConfigId, mountDescriptorId, nodeId)
placementId = DirectoryEntry RecordId, or rootPlacementId for the route root
HostFileId  = H(DOM_FILES_HOST_FILE,
                routeConfigId, mountDescriptorId, placementId, nodeId)
raw62       = uint64be(HostFileId[0..7]) & 0x3fff_ffff_ffff_ffff
hostFileId64 = isRouteRoot ? 1 : raw62 + 2
```

Adapters persist the full-to-64-bit map, compare the full IDs on every reuse,
and fail if two full IDs map to the same `hostFileId64` instead of silently
merging objects. `isRouteRoot` is traversal context, not inferred from a
bytes32 equality. ID 1 is the native mount root; non-root IDs are in
`2..2^62+1`. `hostFileId64` is the common native inode/file-ID candidate as
well as exposed metadata; local opaque handle tokens remain separate. Because identity is
placement-specific, two names for one Node are not host hard links in the
common profile.

Portable host metadata is deterministic but not semantic authority:

- file mode `0444`, directory mode `0555`, `nlink=1`; no symlink or executable
  bit is inferred from extension, MIME, or content;
- uid/gid/owner security descriptor identify the local mount process/user only;
- file size is exact `ChunkTree.totalSize`; directory size is zero;
- birth time is the first valid publisher-charter Binding source block time;
- file mtime is the selected file-head Binding source block time; file ctime is
  the later of placement and file-head source times;
- directory mtime/ctime is the maximum source block time of every current
  name-slot Binding head (BOUND or TOMBSTONED) across every active namespace
  Plan Principal, or its charter time when no slot has mutated. Content-head
  edits do not change directory time; masks/removals do;
- atime equals mtime and never mutates EFS;
- all times are labeled chain-observed display metadata, not author claims.

If the required block header or complete directory is unavailable, metadata is
`UNKNOWN`; the adapter does not invent the current wall clock. Chain timestamps
are unsigned seconds with nanoseconds zero. Every adapter converts exactly or
returns `RESOURCE_LIMIT(METADATA_RANGE)`/`EOVERFLOW`/`STATUS_INTEGER_OVERFLOW`;
platform-specific clamping is forbidden. `statfs` reports
only local cache capacity with a `LOCAL_CACHE_ONLY` flag. Remote publication
cost/quota and byte-carrier availability are separate APIs, never synthetic
free-space numbers.

The portable `HostEntryMetadataV1`/Web manifest contains at least:

```text
filesViewId, routeConfigId, mountDescriptorId,
placementId, entryRecordId, nodeId,
selectedPrincipalId, nameBindingRevision, nameBindingSourceOccurrence,
fileRevisionId?, chunkTreeId?, size?, mime?,
realmId, blockHash, result, completeness,
selectedAuthorityGrade, authorityEvidenceCommitment,
profileValidationGrade,
filesFinalityReportId, finalityGrade, proofProfileId,
freshnessPolicyId, recordedFreshnessGrade, currentFreshnessGrade,
filesResultGradeBytes,
retrievalPrivacyReportId?, retrievalMode?, disclosedObserverClasses?,
directoryProjectionId?
```

The mount daemon exposes that structure and raw canonical name bytes through
one portable control protocol. Linux/macOS use a same-user Unix-domain socket;
Windows uses a same-user ACL'd named pipe. The endpoint is returned by the mount
manager, never injected as a child. Both transports carry identical frames:

```text
u32be frameLen || u8 version=1 || u8 messageKind ||
u16be reservedZero || u64be requestId || payload
```

`frameLen` counts the bytes after the four-byte length prefix and is
`12..1,048,576`; short/oversize frames, nonzero reserved bits,
unknown kinds, trailing bytes, and response/request mismatches reject. The
closed message kinds are `0x01 GET_ENTRY`, `0x02 LIST_DIRECTORY`, `0x03
GET_PROPERTY`, `0x04 LIST_PROPERTIES`, their response values with bit `0x80`
set, and `0xff ERROR`. Every request payload begins with `bytes32
mountSessionId`. Exact request payloads are:

```text
GET_ENTRY =
  mountSessionId || u8 selectorKind ||
  (selectorKind=1: u16be segmentCount ||
     repeat(u16be nameLen || canonicalNameBytes)) ||
  (selectorKind=2: bytes32 pinnedHandleToken)

LIST_DIRECTORY =
  mountSessionId || bytes32 pinnedDirectoryHandle ||
  u16be cursorLen || cursorBytes || u16be limit

GET_PROPERTY | LIST_PROPERTIES =
  mountSessionId || u32be canonicalPropertyQueryLen ||
  canonicalPropertyQueryBytes
```

`cursorLen=0` means start; otherwise it is exactly the fixed
`HostDirectoryCursorV1` length. A response payload is `u16be resultCode ||
u16be reasonCode || u8 completeness || u8 flags || u16be itemCount || u32be
bodyLen || canonicalBodyBytes`. The response kind must equal request kind OR
`0x80`. `ERROR` is `u16be resultCode || u16be reasonCode || u32be detailLen ||
detailUTF8`, with `detailLen<=1,024`; detail is diagnostic and never changes
the typed result. All scalar/property/metadata/page bodies use the frozen
cross-platform IDL, length/count exactness, and no trailing bytes.

The candidate semantic IDL has:

```text
getEntryV1(mountSessionId,
           PATH(canonicalSegmentBytes[]) | HANDLE(hostHandleToken))
  -> HostEntryMetadataV1

listDirectoryV1(mountSessionId, pinnedDirectoryHandle,
                HostDirectoryCursorV1, limit)
  -> DirectoryProjectionRowV1[], nextCursor, result, completeness
```

`limit` is `1..1,024`. A pinned handle never changes FilesView or projection.
`HostDirectoryCursorV1` is exactly `u8 version=1 || u8 family=1 || u16be
reservedZero || bytes32 filesViewId || bytes32 mountDescriptorId || bytes32
directoryNodeId || bytes32 directoryProjectionId || u32be nextIndex`; end is
`nextIndex == entryCount`. Wrong session/view/mount/node/projection, noncanonical
index, or reuse after refresh rejects. Handle tokens and session endpoints are
local capabilities, not portable IDs; every returned semantic field is.
`HostEntryMetadataV1`, row, result/reason, and xattr value binary widths are
minted in the same cross-platform IDL/vector bundle before any adapter claims
parity.

Fixed diagnostic
xattrs/EAs contain lowercase hexadecimal or enum values only:
`user.efs.view`, `.route`, `.mount`, `.entry`, `.node`, `.principal`,
`.binding-revision`, `.file-revision`, `.content`, `.realm`, `.block`,
`.result`, `.completeness`, `.authority-grade`, `.finality-report`,
`.finality-grade`, `.freshness-grade`, `.retrieval-mode`,
`.retrieval-observers`, and `.projection`. Values unavailable or redacted
under a private profile are omitted with the control result saying why; an
incomplete property list never proves absence. No `.efs` or other magic child
is injected into the namespace, because it could collide with real data.

### 10.1 Application properties

`PROPERTY` remains application/profile data, not a privileged Core kind or one
untyped global bag. A mount that advertises application properties pins an
immutable `FilesPropertyProfile/1` candidate through
`PublicFilesMountConfig.propertyProfile`. That profile closes the admitted
Property Type set, exact attachment role (`OBJECT` or path-specific `ENTRY`),
key/value codec, scalar-versus-structured shape, cardinality, declared indexes,
public-projection eligibility, and per-value byte cap. Its `metadataPlan` has
the exact Files metadata purpose/scope and resolves cardinality-one keys;
many-valued facts remain sets and are never Lens-selected as one value.

The portable control ABI is basis-qualified and lossless for the declared
profile:

```text
getPropertyV1(filesViewId, mountDescriptorId,
              attachmentKind, attachmentId, propertyKey,
              candidateCursor, candidateLimit)
  -> selected?, candidates[], nextCandidateCursor,
     coverage, completeness, result

listPropertiesV1(filesViewId, mountDescriptorId,
                  attachmentKind, attachmentId,
                  keyCursor, keyLimit, candidateLimitPerKey)
  -> propertyEntries[], nextKeyCursor,
     coverage, completeness, result
```

Limits are `1..64` keys and `1..64` candidates per key. Every cursor commits
version, FilesView, Mount, property-profile Record, metadata Plan, attachment
kind/ID, key when applicable, basis, and next physical position; malformed,
cross-view, cross-object, or cross-profile reuse rejects. Each candidate carries
the original typed key/value, TypeSchemaId, RecordId, OccurrenceRef,
PrincipalId, lifecycle/current Binding revision when applicable, authority
grade, basis, and selected/losing disposition. `COMPLETE` means every declared
Type/index/scope page is terminal. Missing profile/index coverage,
history/provider loss, or budget exhaustion is `UNSUPPORTED`, `UNKNOWN`, or
`PARTIAL`, never property absence.

Only complete, selected, public, cardinality-one scalar values within the host
cap project to `user.efs.prop.<base32(propertyKeyDigest)>` on Linux/macOS and
the identical lowercase ASCII EA name on Windows. The canonical value envelope
contains version, original key/value, Principal/Record provenance, grade, and
basis; it is not merely the scalar bytes. Losing candidates, many-valued or
structured properties, private values, and overflow remain control-only.

```text
DOM_FILES_PROPERTY_KEY = keccak256("efs2/files/property-key/1")
propertyKeyDigest = H(DOM_FILES_PROPERTY_KEY,
  propertyProfileRecordId, keccak256(canonicalPropertyKeyBytes))
```

Base32 is lowercase RFC 4648 without padding over the complete 256-bit digest.
If distinct canonical keys produce the same projected xattr/EA name, or a name
conflicts with a fixed diagnostic attribute, the directory projection fails
`PROJECTION_COLLISION`; enumeration order never chooses a winner or overwrites
one value.
`listxattr`/EA enumeration fails with retry/I/O on incomplete property
enumeration rather than silently truncating. Linux, macOS, and Windows must
produce the same control pages and projected eligible values.

The exact `FilesPropertyProfile/1` MC/1 blob and application Property families
are not yet frozen. Until they are, the fixed diagnostic attributes above are
usable but a mount may not claim the adopted lossless application-property
surface. This is a blocking mount-profile evidence gate, not a reason to add a
universal Core Property type.

The initial required mount is read-only. Every create/write/truncate/rename,
metadata, xattr/EA, alternate-stream, and local-tombstone syscall fails without
masking remote EFS state. A future writable mount is a local staging/signing
product layered on the FilesRouter semantics, not part of Files/1 correctness.

## 11. Privacy and security boundaries

Public Files/1 exposes plaintext names, topology, authorship, and index
metadata. Hashing the name role does not hide a low-entropy filename from a
dictionary attacker.

Every conforming authoring client runs a local, user-controlled sensitivity
decision before encoding, signing, uploading bytes, or constructing a public
Envelope:

```text
PUBLIC
PRIVATE
RESTRICTED_TO_CAPABILITY
UNCLASSIFIED_SENSITIVE
```

The policy lives in the user's local encrypted profile/configuration; it is a
publication-safety control, not portable Files authority. Missing, locked,
unavailable, or undecidable policy state is `UNCLASSIFIED_SENSITIVE`. The
nearest explicit directory/placement policy is inherited by descendants; a
child may become more restrictive without making siblings less restrictive. Known
private/restricted material and `UNCLASSIFIED_SENSITIVE` fail closed before any
public Locator or Record is minted. A deliberate public override is a separate
user confirmation bound to the exact prospective object/name/content digests;
the confirmation log contains no plaintext and is not itself publication
authority. Automated MIME/name heuristics may raise sensitivity, never clear
an inherited restriction.

The decision is evaluated independently for every placement. Reusing one Node
or plaintext ChunkTree across a public and purportedly private placement does
not make the latter private and is rejected. A private placement of material
that is or was public requires a fresh opaque Object and ciphertext commitment,
not merely another DirectoryEntry.

Public and private/linkable material are never mixed in one Envelope or routed
operation. Moving public material to private storage cannot erase its public
history: the client warns explicitly, creates a fresh opaque private Object and
placement, and masks the public placement only if authorized. It does not
publish a public old-to-new link by default. “Make private” therefore prevents
future accidental disclosure; it is not retroactive deletion.

A private subtree must enter an explicit encrypted-directory Mount profile.
Within that profile, the public tree contains only the opaque boundary; child
names and structure live in an authenticated encrypted manifest, and content
ChunkTrees commit ciphertext. Without the capability/key, traversal returns
`ACCESS_REQUIRED/OPAQUE`; it never reports absence or falls through. Missing
ciphertext is `BYTES_UNAVAILABLE/UNKNOWN`. Exact AEAD/KEM, padding, manifest,
key-distribution, rotation, and private-host projection are deferred to the
privacy profile and must pass the existing privacy fixture before a permanent
public-only product could be selected.

The first Files engineering fixture may be public-only, but the permanent v2
product is not thereby narrowed to public-only. Until the encrypted profile is
frozen, entering its reserved Mount returns `ACCESS_REQUIRED/OPAQUE` and the
Web/host clients expose no child count, names, MIME, size, timestamps, aliases,
or negative cache entries across that boundary.

Additional security rules:

- higher-priority malformed, unknown, or unavailable state blocks fallback;
- callers cannot supply an ambient Plan to grant themselves authority;
- route/discovery authority and Files content authority are distinct;
- locator policy is separate from file-version authority;
- executable bytes are never fetched or run before complete required closure
  verification and runner capability checks;
- readers enforce cycle, segment, mount-hop, page, proof, byte, memory, RPC,
  and wall-time budgets;
- caches key at least by FilesView, Mount/Plan, Node/position, and profile—not
  NodeId or path alone.

## 12. Reconstruction contract

A clean implementation with its cache, database, hosted index, and derived
directory snapshots removed must reconstruct, from declared Realm state, the
exact codehash-pinned Router's public receipt state when router certification
is claimed, and byte carriers:

- shared Type schemas and exact IDs;
- File/Directory ObjectGenesis Records and exact
  publisher-charter Binding history/current-maintenance grade;
- directory Entries/Whiteouts and file Revisions;
- MountDescriptor profile/config graphs, purpose-scoped Plans, and
  Principal-qualified Binding heads/history;
- `BindingScope` anchors and paged listings;
- routed consent metadata, canonical operation Records, Core receipts, and
  Router-certified pre/postcondition outcomes when that grade is claimed;
- Realm receipts, revisions, exact Files views, finality reports, and
  citation transcripts;
- ChunkTrees, Locators, acquisition outcomes, and exact file bytes;
- local planned/actual retrieval-observer reports for the reconstruction's own
  RPC/gateway/carrier attempts (not falsely backfilled for historical clients);
- sensitivity/profile boundaries without disclosing private interiors; and
- the same canonical logical tree, `DirectoryProjection` bytes, portable host
  metadata, and host-independent manifest as a second implementation.

Events, storage-slot guesses, a hosted service, and adapter-local reverse maps
are not canonical reconstruction inputs. Optional snapshots and indexes are
disposable accelerators whose contents are checked against the exact view.

## 13. Acceptance and falsification matrix

### 13.1 Names, URLs, and discovery

- NFC composed/decomposed Latin, Hangul, and Angstrom pairs; case pairs;
  assigned/unassigned boundaries at the pinned Unicode version; emoji/joiner,
  bidi, controls, noncharacters, and 255/256-byte boundaries.
- Validation-grade vectors cover zero/structural/full values, weakest-grade
  aggregation, the exact `FILES_ROUTER_ASCII_NAME_V1` boundary, a rich Unicode
  name that is valid offchain but unsupported by the initial Router, and any
  receipt/transcript/host grade mismatch.
- `%2F`, `%252F`, `%2E%2E`, `%252E%252E`, `%25`, overencoded unreserved bytes,
  malformed escapes, invalid/overlong UTF-8, empty components, and trailing
  slash.
- Raw URL, Draft ERC-6860 manual, the versioned Draft-ERC-6944-to-Final-ERC-5219
  composition, SDK, Rust, and Solidity structural adapters produce the same
  segment bytes/result after the same lexical dot traversal.
- Query/control duplicates, unknown versions, query/fragment separation, ENS
  `contentcontract` chain override, userinfo authority isolation, ENS
  repointing, direct route, and exact citation replay.
- Query vectors distinguish `+`, `%2B`, `%20`, escaped `&`/`=`, empty values,
  duplicate application keys, and raw/escaped duplicate control keys without
  form-decoder reordering.
- Exact-citation vectors reject uppercase/short/long adapter addresses, zero or
  leading-zero chain IDs, a control pair that is not first or is duplicated,
  padded/noncanonical base64url, fragments, trailing control bytes, and every
  URL/control/chain/Core/Realm/route/path/application-query/transcript mismatch.
- Root `/`, file/no-trailing-slash, directory/trailing-slash, empty and ordered
  multi-pair `applicationQueryBytes`, PATH versus DIRECT_ID mode, and direct
  zero-path/zero-segment rules have byte-exact golden vectors.
- Directory `/dir` canonicalizes to `/dir/`, file `/file/` canonicalizes to
  `/file`, and relative `child` links resolve identically after presentation
  canonicalization.
- Text 5219 response, arbitrary-binary native response, verified range, and
  external-body compatibility never change the selected content identity or
  verification grade.
- Advertised URL/contract/client limits return the correct typed result and a
  too-long path remains reachable through direct-ID control.
- Historical citation fails honestly through a generic current-state 5219
  client and succeeds through a block-hash-aware client/reconstruction.

### 13.2 Namespace and Lens

- Three-level and deep client paths; file in the middle; empty directory;
  root; missing terminal; cycle.
- Plans 1/8/32/64 with first/last/absent/conflict/unknown, every supported
  combiner, tombstone fallthrough, bound whiteout, and malformed selected
  target.
- Nested directory Mount, mounted foreign File with independent content plan,
  same Node under different Mounts, and cache-isolation failure injection.
- Publisher-charter point proof, attacker-sprayed duplicate occurrences,
  first-tombstone invalidity, later charter tombstone/Withdrawal historical
  validity, wrong-target BOUND rebind, later restoration to the exact charter,
  and distinct historical/current-maintenance grades.
- Wrong Plan purpose/root scope, wrong Binding target kind, nonzero target
  leaf, bare Object/Occurrence target, and mount-root mismatch all fail closed.
- Contextual loop detection keys the active
  `(realmId, filesViewId, mountDescriptorId, nodeId)` stack;
  two legitimate placements of one directory outside the active ancestry do
  not become a false cycle.
- External links reject a target Route whose Realm, root Mount/Object, Files
  profile, basis, or completeness policy does not match the link; wrong target
  ChainRef/Core/descriptor-to-Realm recomputation fails without ambient
  discovery. Re-entering an identical Realm/view/mount/node through another
  link is still a loop.
- Terminal external File and Directory fixtures distinguish source lookup from
  entered/terminal view+Mount, enforce first-use view order with no unused
  entries, and exercise root plus 64 external transitions (65 views).
- No backtracking after selecting a child whose descendant is absent.
- First bind and first tombstone scope anchors; bind/tombstone/rebind churn adds
  one row; withdrawn anchor remains enumerable; historical basis excludes
  later anchors; wrong cursor Realm/basis/scope/view rejects.
- 10,240 dead scope roles followed by 63 live roles: ten empty `PARTIAL` pages,
  then 63 results and `COMPLETE`; no early complete-empty.
- Directory snapshot omission or stale basis never becomes authoritative.

### 13.3 Views and mutations

- Multi-leaf rename/move has no accepted mid-leaf Files view; block state shows
  old or new only.
- Several Router publishes in one transaction roll back together.
- A routed intent submitted directly to Core, submitted through the wrong
  executor/code hash, or with a changed operation hash fails before writes.
- Omitted, reordered, substituted, copied, reentrant, split, and front-run
  intent sets cannot satisfy one certified operation; copying the exact full
  Router call can only execute/deduplicate that same operation.
- A clean state-only reader enumerates the operation Record, every constituent
  batch and `RoutedConsentMetaV1`, and the one completion receipt. A routed
  retry with identical association returns that receipt without writes;
  unrouted/differently routed ACTIVE occurrences and a receipt/condition/batch
  mismatch fail closed.
- Receipt vectors enforce unique selected occurrences, one fresh consecutive
  batch per intent, contiguous `(preAdmissionHigh,postAdmissionHigh]`, and
  byte-identical condition recomputation at both complete-operation boundaries;
  overlap, gaps, reordered batches, an ACTIVE first execution, wrong
  certification/profile grade, and arbitrary mid-batch replay fail.
- Runtime replacement, proxy/delegatecall/admin indirection, codehash change,
  wrong executor, and direct Core submission all fail before the first fresh
  write; the rejected call cannot leave a partial receipt.
- `NOREPLACE` detects an effective destination owned by another/higher Plan
  Principal; Principal-local `expectedRevision=0` alone is rejected as proof.
- Competing creates, stale source/destination CAS, overwrite, unlink, and
  cross-Principal two-signature operations leave zero state on failure.
- Upgrade with no admission proves `executingRevisionId !=
  admissionBasisRevisionId` is represented correctly.
- `REALM_HEAD` stays provisional; each supported `REALM_FINAL` rule passes and
  fails against exact later observation/L1 evidence, and missing evidence never
  upgrades the immutable view's grade.
- Exact links, Web manifests, and host control all carry the same authority,
  profile-validation, finality-report/proof-profile, and recorded freshness
  grades. Wrong-view or
  wrong-rule proof, unavailable/expired evidence, stale assessment replay, and
  current reevaluation mismatch degrade explicitly rather than inheriting an
  old final label.
- Reorg, orphaned block, unavailable archive state, and two Realms sharing the
  same ordinal never alias a FilesView/cursor.
- Cross-Realm link produces a second view leg and never claims atomic rename.
- Every certified write encountering an external leg returns `UNSUPPORTED`;
  create/edit/unlink/copy/rename can proceed only after re-rooting a separate
  operation at the target Realm/Route.
- Cross-Realm exact citation carries every full FilesView once, rejects an
  out-of-range/duplicate/wrong-chain segment view index, and reconstructs with
  all non-root RPCs/caches removed and then independently restored.

### 13.4 Files and bytes

- Initial/edit/merge revision DAG, eight-parent boundary, wrong-node parent,
  copy with shared bytes, repeated placement, selected-old-version rebind, and
  open-handle stability.
- `FILES_MEDIA_HINTS_V1` accepts exact lowercase MIME/charset tokens and rejects
  uppercase, parameters, whitespace, non-ASCII, empty components, illegal
  token bytes, and every 255/256 or 64/65 boundary disagreement identically in
  TS, Rust, and Solidity.
- Create/copy charters are present in the atomic unit; omitting the new Object's
  publisher-charter Binding leaves the copied node invalid and rolls back a
  certified operation.
- Canonical empty file through FileRevision, Locator/representation evidence,
  range API, reconstruction, Web, and mount.
- One-byte, chunk-boundary, odd Merkle tree, maximum geometry, corrupt leaf,
  corrupt proof, wrong total size, EOF, zero range, and late range.
- Corrupt primary rejected before exposure, verified fallback, mixed verified
  carriers, all carriers unavailable, incomplete Locator pages, and false
  whole-file digest with a valid Merkle range.
- Raw RPC, path-aware gateway, direct carrier, OHTTP/audited relay, snapshot
  provider, mixed fallback, and local-replica retrievals expose the exact
  planned/actual observer classes and disclosure masks independently of byte
  integrity. Missing or falsely private reports fail the privacy claim.
- Generic external-body is never mislabeled verified.
- Executable fixture fetches no executable bytes before explicit action and
  executes nothing before full closure verification. Verified HTML/SVG/PDF/XML
  opens in an opaque sandbox with no shared-origin credentials, service worker,
  wallet, network, storage, or ambient EFS authority.

### 13.5 Host and product parity

- Linux/macOS/Windows reserved names, case and normalization collisions,
  trailing dot/space, Windows device names/ADS, macOS colon, long components,
  long total paths, alias-prefix collisions, forced digest collision, and
  generation-bound reverse tables.
- Exact reversible/digest alias vectors, alias-order independence,
  `DirectoryProjection` byte equality, exact rootPlacement/root-ID-1 and
  non-root raw62+2 HostFileId cases, 256-to-64-bit HostFileId collision failure,
  and stale reverse-table rejection.
- The same pinned view yields the same canonical logical manifest in the Web
  Client and all three mounts; native enumeration order may differ.
- `find`/`stat`/copy/hash plus one graphical file manager on each platform;
  exact mode/size/times/IDs/xattrs or EAs/control metadata; local-cache-only
  `statfs`; stable open file/directory handles while the remote head advances.
- Unknown/incomplete directories never become ENOENT or negative cache;
  unavailable/corrupt bytes remain distinct from absent paths.
- Directory times change on BOUND/TOMBSTONED name-slot heads but not file
  content-head edits; missing headers and out-of-range timestamps fail
  identically on Linux/macOS/Windows without local-clock substitution.
- Control-frame truncation/oversize/reserved/kind/request mismatch, wrong
  session/view/mount/node/projection cursor, stale handle, and page boundaries
  fail identically on Unix sockets and Windows named pipes.
- A directory with `2^32-1` projected entries is representable; the next entry
  yields `RESOURCE_LIMIT(DIRECTORY_CARDINALITY)` without truncation while point
  lookup remains available.
- Object- and Entry-attached application properties preserve selected and
  losing provenance through paged control reads; only complete eligible
  public scalar values project to identical xattr/EA envelopes, while partial
  enumeration yields retry/I/O rather than an absent property.
- Property-key digest golden vectors and a forced projected-name collision fail
  the whole xattr/EA projection without overwrite or order-dependent choice.
- Every mutation and metadata path fails read-only.
- Sensitivity inheritance, restrictive child override, unknown-sensitive
  fail-closed behavior, explicit-public confirmation binding, and rejection of
  mixed public/private Envelopes happen before signing/upload.
- Public-to-private warns that history persists and creates an unlinkable
  opaque successor; private boundary without key is opaque with no plaintext
  child count/names/MIME/size/times leak through public Bindings or host
  metadata.
- Conflicting placements of one Node/plaintext ChunkTree under public and
  private policies reject before signing; a private successor uses a fresh
  opaque Object and ciphertext commitment.

### 13.6 Cost and long-horizon gates

- Cross-language exact Type blobs/IDs/bodies for every Files Type.
- Cross-language `FILES_MEDIA_HINTS_V1` and profile-validation-grade vectors,
  including ASCII Router certification and rich-name unsupported behavior.
- Integrated create/edit/rename/unlink at worst name/parent bounds with
  `BindingScope`, exact wire bytes, state writes, cold/warm gas, rollback, and
  reconstruction.
- Integrated routed operation at the 8-intent/64-selected-leaf/7,680-byte
  profile bounds, including Core consent metadata, immutable Router receipt,
  exact retry, direct-submit rejection, and EIP-170/runtime-size accounting.
- Plans 1/8/32/64 point and listing matrices; live-small/history-large
  directories; mount density and cursor state.
- Re-run the 64-leaf aggregate and Git P6 because every first Binding now adds
  one scope posting.
- Complete Core runtime size before adding any contract path loop; keep Files
  validation/router separate if the monolith nears the EIP-170 ceiling.
- Large/deep path RPC response, CPU, memory, and wall-time budgets with typed
  resumable failure.

## 14. Implementation sequence

1. **Freeze-input preparation:** close the V2-E1 uniform-Principal experiment;
   pin the generic `ObjectGenesis/1` schema; mint candidate Files Type blobs
   and Unicode/name tables; repair empty `ChunkTree/1`; add `BindingScope` and
   `RoutedAdmissionIntent/1` and retained consent metadata to the candidate
   Codex/interface corpus.
2. **Pure resolvers:** independent TypeScript and Rust parsers, Files resolver,
   listing reducer, view/citation transcript, range verifier, and host aliaser
   over exact golden vectors.
3. **Disposable Solidity:** integrated multi-leaf Core successor with
   `BindingScope`, executor/operation-bound consent, point Lens reads, and a
   separately deployed/codehash-pinned FilesRouter; measure without claiming
   adoption.
4. **Direct Web vertical:** clean-browser guest route, canonical path, directory
   listing, exact file, corrupt-primary rejection, verified fallback, and
   Web/OS manifest equality.
5. **Three-host read-only adapters:** one shared resolver core through Linux,
   macOS, and Windows acceptance corpora.
6. **Independent reconstruction/red team:** delete caches/indexes, rebuild from
   state/carriers, run all falsifiers, and return only measured mechanism or
   permanent product forks.
7. **Freeze and product scope:** exact name pin, index mechanism, contract/module
   boundary, private/cross-Realm/writable release scope, and any remaining
   owner-sized choices close only through V2-F1/F2.

## Open questions

- [ ] **Evidence gate — Unicode:** archive/hash the candidate Unicode 17 tables,
  produce cross-language name vectors, and compare rich names against the ASCII
  slug fallback in raw/manual/5219, initial Router certification, and all three
  host projections. This is not an immediate owner ask.
- [ ] **Evidence gate — BindingScope:** implement the exact Codex delta at
  genesis, prove clean-room reconstruction and hostile-churn pagination, and
  remeasure aggregate/P6 cost. If it fails, compare an authenticated live-map
  index without changing per-name Binding authority.
- [ ] **Evidence gate — FilesRouter:** prove plural-Plan `NOREPLACE`, rename,
  overwrite, cross-Principal signatures, executor/code-bound routed consent,
  persisted operation/receipt reconstruction, direct Core bypass rejection,
  complete-operation commitment, exact rollback, and postconditions. A Router
  without Core-enforced and retained consent does not pass.
- [ ] **Evidence gate — route/citation:** freeze the direct exact-link grammar
  and canonical transcript after ENS/ERC-6944/ERC-5219/manual, generic-client,
  relative-link, cross-Realm view-vector, authority/finality/freshness,
  active-content, and historical-RPC tests.
- [ ] **Evidence gate — host contract:** freeze `CommonHostAlias/1`, portable
  metadata/control ABI, DirectoryProjection bytes, and Linux/macOS/Windows
  golden behavior without narrowing canonical EFS names to one host.
- [ ] **Evidence gate — property profile:** mint the exact
  `FilesPropertyProfile/1` and representative OBJECT/ENTRY property families;
  prove basis-qualified complete selected/losing enumeration and identical
  xattr/EA envelopes on all three hosts. Fixed diagnostics do not satisfy this
  gate by themselves.
- [ ] **Evidence gate — locator policy:** pin the bounded admissible Locator
  enumeration/selection profile and hostile-spray behavior separately from
  content-head authority.
- [ ] **Evidence gate — retrieval privacy:** freeze the observer/disclosure
  registry and prove raw-RPC, gateway, direct carrier, relay/OHTTP, snapshot,
  mixed, and local-replica reports in Web and mount control. This is disclosure,
  not an anonymity claim or Core primitive.
- [ ] **Deferred profile — private subtree:** specify encrypted manifest,
  AEAD/KEM, padding, capability, rotation, recovery, and host projection before
  a permanent public-only release scope may be chosen.
- [ ] **Deferred product scope:** contract full-path cap, cross-Realm nested
  mounts, and writable mounts return only after their measurements; none is
  required to make the core hierarchical data model sound.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] Inputs/authority reviewed; no proposal mislabeled as an adopted ruling
- [ ] V2-E1 uniform Principal and historical authority proof are closed before
  permanent Files Type/operation bytes are minted
- [ ] Exact Files Types, Unicode tables, purpose/role constants, result registry,
  `FILES_MEDIA_HINTS_V1`, profile-validation grades, and golden vectors frozen
  together
- [ ] `BindingScope` reconstruction, gas/state, cursor, aggregate, and P6 gates pass
- [ ] `RoutedAdmissionIntent/1` + FilesRouter bypass, reconstruction,
  plural-Plan, mutation, and
  rollback gates pass before any view-level precondition is called certified
- [ ] Direct Web guest and Web/OS canonical-manifest parity gates pass
- [ ] Exact links/Web/mounts preserve authority, finality proof, freshness, and
  retrieval-observer disclosures without collapsing them into one trust bit
- [ ] Linux, macOS, and Windows read-only golden fixture passes
- [ ] Lossless property control pages and eligible xattr/EA projections pass
  the same three-host fixture, or the mount is labeled without application-
  property conformance
- [ ] Private/cross-Realm/writable scope is implemented or explicitly deferred
  without weakening an adopted requirement
- [ ] Independent clean-room reconstruction and security/adversarial review pass
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [x] Three independent `#status/review` passes found no remaining P0/P1
  data-model, Core-boundary, schema/URL, requirements, or reconstruction defect

## Implementation notes

No durable implementation is authorized by this draft. Disposable Stage B
experiments should use isolated worktrees and retain exact toolchains, inputs,
vectors, measurements, and nonconformance labels.

After promotion, track independently:

```text
- [ ] contracts — Core successor index/profile + FilesRouter
- [ ] sdk       — canonical codec/resolver/view/citation/acquisition APIs
- [ ] client    — direct guest File Browser + verified bytes
- [ ] os/mount  — shared resolver integration + Linux/macOS/Windows adapters
```
