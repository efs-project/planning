# Source-pinned C0 Type engineering inputs

Sixteen temporary candidates, in the four G4 groups, are now reproducible as
machine-readable descriptor trees, exact MC/1 blobs, ordered group bytes,
SR-17 Record bodies, and temporary TypeSchemaIds. Fifteen field layouts are
source-supported; the seal's layout is an explicitly labelled engineering
choice over G11's ordered field names. Nothing here is admitted, initialized,
ceremony-final, deployed, or full C0. Do not substitute these IDs into `efs-lab/1`.

## Run and consume

From the planning worktree root, using the prior rehearsal's installed Node
toolchain and ethers 6.15.0 (no new dependencies):

```sh
node --test Reviews/2026-09-05-mvp-build-start/type-inputs/*.test.mjs
node Reviews/2026-09-05-mvp-build-start/type-inputs/materialize.mjs --check
```

To deliberately regenerate the temporary output after reviewing an input
change, use the same materializer with `--write`. Without a flag it emits JSON
to stdout. `--check` verifies pinned source-file SHA-256 digests, independently
parses every member, reconstructs ordered IDs, and compares the complete result
byte-for-byte with the retained artifact. No RPC, signing, or transaction is used.

- `inputs.v1.json`: explicit field trees, role targets, indexes, constraints,
  source sections, contextual rule inventory, and labelled temporary choices.
- `artifacts.v1.json`: expanded descriptors, per-member `blobHex`, per-group
  `groupHex` and length-prefixed `recordBodyHex`, sizes, and explicitly named
  `temporaryTypeSchemaId` / `temporaryGroupHash`. Hex strings omit `0x` except
  IDs/hashes. Core/SDK engineers can consume these as next-slice test inputs,
  **not** as an already admitted schema registry.
- `encoder.mjs`: packed MC/1 descriptor encoder and ethers ABI-word ID derivation.
- `parser.mjs`: independent cursor parser and validation of the candidate
  subset, constructing hash-preimage words directly. It imports no encoder
  helper. Both use ethers' Keccak implementation; this is independent
  parsing/preimage construction, not independent cryptography or languages.
- `*.test.mjs`: twelve tests, including two manually constructed small literal
  vectors, ordered/member substitution, exact consumption, sentinel and
  reference closure, role/index errors, reference fanout, extraction bounds,
  source drift, duplicate nested STRUCT names, and exact carriage boundary tests.

## Byte-carriage results

| G4 group | Members | groupBytes | Record body (u16 length + group) | Group budget remaining |
|---|---:|---:|---:|---:|
| 1: foundation/content | 6 | 1,765 | 1,767 | 6,425 |
| 2: Binding kernel | 3 | 1,022 | 1,024 | 7,168 |
| 3: Files | 6 | 2,345 | 2,347 | 5,845 |
| 4: temporary seal candidate | 1 | 860 | 862 | 7,330 |

The actual bounds are `MAX_GROUP_BYTES=8190` and `MAX_BODY_BYTES=8192`.
The group count and each blob's length prefix count toward the former; the
outer BYTES prefix counts toward the latter. Boundary tests accept 8,190 and
reject 8,191 group bytes. These four candidates are **byte-carriageable as four
ordinary TypeSchemaGroup Record bodies**. They have not been proven deployable:
no gas/materialization measurement, intrinsic TypeSchemaGroup Codex ID,
capability manifest, authenticated publication, Record/Envelope/Occurrence
wrapper, Core cache, or reconstruction has been implemented here.

## Source authority and corrected inventory

Source revision: `1a51c5d728766f25d31fcf7575e578dca3aaf780`; exact SHA-256
commitments and repository-relative paths are in the input and artifact.

- [Encoding §§2.2–2.7, 3.1–3.4, 5](../../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md):
  exact packed grammar, roles/indexes/constraints, member-index formulas,
  sentinel rules, SR-17 carriage. The parser does not hash prose field lists.
- [Binding §3.2](../../2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md):
  exact kernel role/index rows, including unused expectedType words encoded
  zero and precisely one direct OCCREF for Withdrawal.
- [Content §§2.1, 3–6](../../2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md):
  **ByteDigest has only DIGEST, no size** (lines 313–332). Locator is subject,
  URI and three optional observations, not an assumed transport variant.
  Multi-Type roles use **ANY with reader-side allowsets** (lines 242–245):
  this is prescribed encoding, not permission to narrow them silently. C0
  excludes ArtifactClosure as an admitted Type; those broader profile targets
  do not become missing exact-Type dependencies in these descriptor bytes.
- [Files §§3.1–3.5, 7.2](../../../Designs/efsv2/hierarchical-files-and-folders.md):
  exact Object/Files field models. Empty-tree correction (lines 1067–1084)
  supersedes the older content minima: count and total size can be zero;
  only `(262144,0,0,keccak256(0x02))` is the valid empty profile tuple.
- [Genesis G4/G11](../../../Designs/efsv2/mvp-c0-genesis-manifest.md):
  exact 6/3/6/1 inventory and left-to-right order; no ID-based sorting.

## Remaining exact engineering decisions

1. **Semantic metadata:** meaning text, specDigest choice, and namespaceQualifier
   are not ceremony-final. This candidate uses the input's literal template and
   ASCII qualification bytes padded to 32 bytes. Its specDigest commits the
   exact **primary source file**, not a paraphrase. It is not a complete
   normative-closure commitment: e.g. the ChunkTree Files override is separately
   pinned in the artifact's source set. A final semantic spec bundle must close
   every source and rule before final metadata is minted. Changing any descriptor
   changes the group and all its member IDs and downstream exact references.
2. **Files/ObjectGenesis/index bundle:** those field-model sections do not
   enumerate a byte-exact index/constraint bundle. The input explicitly chooses
   no ObjectGenesis scalar indexes and backlinks for each Files role, with no
   extra scalar indexes. It does not invent top-level NAME_PROFILE constraints
   from richer FilesName/MIME contextual validation. Binding, ResolutionPlan,
   ByteDigest and the declared Locator/Representation backlinks follow source
   rows. ChunkTree's no-extra-index choice is temporary. Capability/Codex closure
   and global digest lookup remain unimplemented, not silently satisfied.
3. **Seal grammar:** G11 lines 369–384 names fields/order only, not MC/1 kinds,
   widths, ReferenceRoles or IndexSpecs. The input chooses bytes32 hashes and
   Realm/roots, bytes20 address, full-width PRINCIPAL, six exact typed references,
   UINT(8) admission high and six backlinks. Every choice is visible under
   `shapeStatus=TEMPORARY_LAB_CHOICE_NOT_FIXED_BY_G11`. Confirm these fields before
   calling this an exact source-fixed seal descriptor.
4. **Route enum values:** Files lines 592–593 specify `uint8` and symbolic
   `REALM_FINAL | REALM_HEAD`, `REQUIRE_PROVEN | ALLOW_GRADED`, but do not assign
   numeric codes in that Type definition. No codes or INT_RANGE constraints
   are invented here. This does not block the descriptor widths, but does block
   claiming exact canonical Route instance bytes until a run codec supplies them.
5. **Contextual/effect validation:** `profileRules` are explicit obligations,
   not executable body validation: Plan frame semantics, FilesName/MIME,
   same-File sorted parents, mount/config/purpose checks, unique empty-tree
   arithmetic, digest allowsets, Locator observations, and Binding kernel
   cardinality/CAS all remain for their actual implementation layers.

## Checker limits and next slice

The checker validates this candidate descriptor subset, not all SR-17 schemas
or all Record bodies. It deliberately rejects non-ASCII schema text rather than
claim Unicode-16 STRUCT-FULL conformance, and supports only DIRECT roles in the
candidate set (not ARRAY_STRUCT_MEMBER). Extraction checks use a conservative
prefix/branch upper bound, not a production E1 extraction compiler. The encoder
can emit malformed fixtures; independent parsing is the acceptance gate.
`maxStructuralBodyBytes` is a schema upper bound using the global 68-byte
maximum DIGEST, not the narrower content-profile maximum or measured gas.

The next real-contract slice can use these bytes to test intrinsic
TypeSchemaGroup ordinary admission and atomic cache materialization with
independent state read-back under the current engineering authorization. The
next slice may proceed with explicitly recorded temporary seal/index/metadata
choices and an exact run-local Codex/capability inventory; it does not need to
await permanent owner ratification. Permanent promotion and ceremony-final
bytes remain separate, human-gated decisions.
Anticipated IDs are never admitted state. No M0 row is claimed.
