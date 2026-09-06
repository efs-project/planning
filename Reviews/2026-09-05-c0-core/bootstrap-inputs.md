# Bootstrap input refinements for the continuous C0 run

**Status:** run-local engineering specification; not an implemented bootstrap,
permanent protocol choice or completed G0–G12 evidence.

This closes the aggregate Type-root grammar left unspecified by G0/G4 and
clarifies G3's existing digest-read obligation. It preserves the exact sixteen
[candidate Types](../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json),
their source commitments and the [manifest's](../../Designs/efsv2/mvp-c0-genesis-manifest.md)
6/3/6/1 member order. Capability/authority serialization remains separate work.

## Ordered Type-root codec, version 1

Use the existing SR-17 `groupHash` for each group, not a new group identity:

```text
groupHash = keccak256(abi.encode(
  keccak256("efs2/typeschema-group/1"), keccak256(groupBytes)))

D = keccak256("efs2/mvp-c0/ordered-type-groups/1")
orderedTypeGroupManifest = abi.encode(D, bytes32[4] groupHashes)
orderedTypeGroupRoot = keccak256(orderedTypeGroupManifest)
```

The manifest is exactly 160 bytes: domain word, then groups 1/2/3/4 in G4
order. A fixed ABI array has no offset or length word. There is no extra
version/count field, integer truncation, inner manifest hash, dynamic-array
offset or trailing data. This version's domain fixes four group positions.

Decoder rules: require exactly 160 bytes, exact domain, four nonzero distinct
hashes and byte-identical re-encoding. Nonzero/distinct hashes are explicit C0
run restrictions, not changes to SR-17's imported Type grammar.

The verifier additionally derives the four hashes from original group bytes,
checks canonical group/member framing and counts 6/3/6/1, checks ordered
dependency closure, and compares with the **independently established expected
root** from the experiment seed. The decoder alone cannot know a Type's name
or detect a self-consistent reordered inventory. Reorder/substitution is an
expected-root mismatch, not a claim about syntactically malformed bytes.
Never compare only a caller's manifest against the same caller's root.

G4 admission must enforce this committed inventory before writes; a later
reader detecting substitution is not a substitute for admission enforcement.
Retain complete group Record bodies in state so G12 reconstruction does not
depend on the source checkout. Member IDs remain transitively committed by
each group hash and their zero-based member order. The intrinsic meta-Type
remains separately committed in Codex material; it is not a fifth G4 group.

This adds no dependency cycle: group hashes and the root depend on candidate
descriptor bytes, not addresses, experimentSeed, final profile, or a seal
instance body. A changed inventory requires a changed root and a fresh run.

Why this format: embedding the roughly 6 KB of existing group bytes again
would duplicate data already retained by ordinary admission; a general
variable-count manifest adds no current C0 requirement. Fixed hash words are
the smallest useful encoding for this explicitly fixed control. A broader
future inventory gets a different version, not a silent extension of this one.

## Literal vector and evidence ceiling

[The literal vector](ordered-type-root.vector.json) was computed from unchanged
candidate bytes at `63ef611`. The four byte lengths are 1765/1022/2345/860.
ABI encoding and a separately assembled five-word byte string agree on the
160-byte preimage and root. Swapping groups 1 and 3 changes the root even
though both groups contain six members.

This is a one-off framing/hash cross-check, not two independent implementations
or a completed encoder/decoder test suite. The next codec implementation must
test short/trailing input, wrong domain, zero/duplicate hashes, reordered,
missing/substituted groups, group framing/counts, expected-root mismatch and
state-only recovery. Keep a literal root assertion separate from round-trip
self-agreement. No sample root is a valid full genesis by itself.

## G3 digest lookup without changing Type bytes

For C0 byte/Files data, the required path is:

```text
algorithm + digest
  → deterministic ByteDigest/1 RecordId
  → ordinary exact Record point read
  → declared reference/backlink queries
```

This is explicitly the [content-locator §2/§4 path](../2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators.md).
Validate the content profile's algorithm/length rules; structural DIGEST
validity alone is not all content-profile validity. ByteDigest declares no
additional index. The current sixteen candidates have 27 REF_BACKLINK specs
and no SCALAR_EQ or DIGEST_EQ specs; do not mutate their blobs to manufacture
population in another family.

General `KIND_DIGEST` support, declared DIGEST_EQ population and the exact
ByteDigest point path are separate claims. The stateful synthetic-schema
tests can pressure the general family, but an empty kind-9 list neither
implements byte lookup nor proves byte unavailability. The complete C0 run
must demonstrate the actual ByteDigest point/backlink path against its own
admitted inventory, with normal basis/coverage qualification.

## Closed capability manifest for the next serializer

Use a fixed inventory with behavior defined by capability code. Do not store
live posting counts, mutable coverage or caller-selectable RAW_AUDIT flags in
the immutable manifest. This is a run-local engineering format, not an
implemented capability getter or the unchanged B0 INDEX module.

```text
D = keccak256(UTF8("efs2/mvp-c0/index-capabilities/1"))
manifest = D:bytes32 || orderedTypeGroupRoot:bytes32
           || resolvedReferenceClasses:uint8 || Entry[18]
Entry = capabilityCode:uint8 || supportCode:uint8
indexCapabilityRoot = keccak256(manifest)
```

The encoding is exactly 101 packed bytes, with entries 1 through 18 in that
order; no ABI padding, offsets, count or trailing bytes. `supportCode` is 0
(explicitly unsupported) or 1 (enabled from genesis), never a confidence or
test-result code. A complete G3 C0 bundle requires all eighteen rows to be 1;
zero rows can describe unfinished tooling but are not valid complete genesis.
Do not advertise a planned row as enabled before its implementation is present.

For the current C0 resolver, `resolvedReferenceClasses` must equal `0x19`:
bit `class−1` names runtime resolution support for classes 1/4/5. Any other
mask rejects in this closed version. Classes 2/3 remain valid structural grammar, with explicitly
unsupported runtime existence resolution. This does not confuse a full-width
Principal-valued field with a PRINCIPAL-class reference.

| Code | Capability (existing kind where applicable) | Fixed behavior |
|---:|---|---|
| 1 | Type point | Exact admitted cache/Type; explicit intrinsic meta-Type case. |
| 2 | Record point | Retained exact Type/body/first admission, not deleted by withdrawal. |
| 3 | Envelope point | Retained unsigned header and full membership vector. |
| 4 | Occurrence point | Exact mapping plus lifecycle, including non-active states. |
| 5 | Receipt point | Accepting-batch evidence; lifecycle remains separately qualified. |
| 6 | Global admission page | Admission-order log and its own bounded continuation. |
| 7 | Unique Records by Type (2) | Stable first-occurrence anchors; live if any occurrence is live at the basis; nested cursor budget. |
| 8 | Occurrences by Type (1) | Mandatory occurrence posting with basis liveness. |
| 9 | Occurrences by Record (3) | Mandatory occurrence posting; supplies Record live-set transitions. |
| 10 | Occurrences by Principal (4) | Mandatory occurrence posting; full bytes32 Principal. |
| 11 | General backlinks (5) | All actual extracted refs; stable dedup and basis liveness. |
| 12 | Typed-role backlinks (6) | Exact Type/role predicate; stable dedup and basis liveness. |
| 13 | Scalar equality (7) | Declared SCALAR_EQ only; undeclared query is UNSUPPORTED. |
| 14 | Binding point | Current head and bounded at-basis lookup; authoritative Realm-local UNSET. |
| 15 | Binding history (8) | RAW_AUDIT physical revisions; no lifecycle filtering or decrement. |
| 16 | General digest equality (9) | Declared DIGEST_EQ population; ordinary basis liveness. |
| 17 | ByteDigest lookup recipe | Exact digest-derived Record point, then declared backlinks; no new physical index. |
| 18 | BindingScope (10) | RAW_AUDIT first-bind or first-tombstone anchor once; never filtered or decremented. |

Reference-class support qualifies rows 11/12. History/Scope hydrate lifecycle
separately; RAW_AUDIT is fixed by kind, not a caller flag. A bounded page can
be PARTIAL even with no items. An empty final suffix cannot prove whole-query
absence without its complete origin-to-high-water continuation chain.
External transport failure remains UNKNOWN, not an authoritative empty result.

Verify the manifest's Type root against the independently established seed
root, then independently derive descriptor declarations from retained groups:
6/3/6/1 members, 27 REF_BACKLINK, zero SCALAR_EQ and zero DIGEST_EQ. Do not
duplicate that inventory or changing posting totals in the root. Required
general/role postings arise from actual refs; REF_BACKLINK creates no third
posting family. A supported, not-yet-populated family is not unsupported.

Place these exact manifest bytes once in a **versioned C0 INDEX module** and
return the same bytes from the capability getter. Do not include RealmId,
deployment addresses or an enclosing Codex hash: those introduce avoidable
commitment cycles. Final owner-module framing, code/layout tables and Scope's
domain/cursor/RAW_AUDIT amendments still need exact integration before Codex
minting. B0's unchanged history-only RAW_AUDIT rule cannot describe C0 Scope.
The enclosing Codex commitment is not replaced by `indexCapabilityRoot`.

Why this choice: fixed code/support pairs are easy to inspect and reject when
reordered or duplicated. A compressed support bitset would save only a few
dozen bytes but obscure rows; a generic extension registry adds an unneeded
late-activation mechanism to a deliberately genesis-fixed run.

The source obligations are [G3](../../Designs/efsv2/mvp-c0-genesis-manifest.md#g3--activate-and-prove-index-capabilities-before-writes),
[INDEX §§0.1/3/5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md),
[Files §5](../../Designs/efsv2/hierarchical-files-and-folders.md#5-complete-directory-enumeration-bindingscope)
and [Codex ownership](../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md).
All eighteen enabled claims need actual bounded endpoint/continuation evidence;
raw storage getters and passing key helpers alone do not meet that gate.

## Remaining input work, not owner questions

1. Implement/review the aggregate-root codec and wire its expected inventory
   into actual G4 admission and G12 reconstruction.
2. Implement the closed capability manifest above, integrate its versioned
   INDEX ownership and independently verify every enabled endpoint/continuation.
3. Specify the C0 authority module support/basis/error program rather than
   copying B0's unsupported active verifier rows. Composite EOA, direct EOA
   and same-Principal session remain three distinct retained evidence paths.
4. Specify session grant/approval bytes, ID, nonce lanes, revocation and exact
   metering; the current trusted state host establishes none of that authority.
5. Implement the [dependency-aware V2 deployment refinement](dependency-deployment-v2.md)
   for the selected linked prototype. Preserve V1 evidence; verify all four
   components, actual links/runtime patches and atomic initialization/seal.
   The normal three-contract smoke is not complete G0–G12 evidence.

The read-only bootstrap-input reviewer found this root format and digest
mapping coherent, conditional on expected-root enforcement and state retention.
No immediate owner decision is needed for the reversible implementation.
