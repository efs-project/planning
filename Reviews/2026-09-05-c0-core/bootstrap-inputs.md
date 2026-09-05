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

## Remaining input work, not owner questions

1. Implement/review the aggregate-root codec and wire its expected inventory
   into actual G4 admission and G12 reconstruction.
2. Specify ordered capability-entry fields/widths/root and map actual Type
   declarations, digest-read behavior and RAW_AUDIT BindingScope explicitly.
3. Specify the C0 authority module support/basis/error program rather than
   copying B0's unsupported active verifier rows. Composite EOA, direct EOA
   and same-Principal session remain three distinct retained evidence paths.
4. Specify session grant/approval bytes, ID, nonce lanes, revocation and exact
   metering; the current trusted state host establishes none of that authority.
5. If measured runtime requires a stateless helper, first version the deployment
   dependency commitment/readback. That topology remains unselected.

The read-only bootstrap-input reviewer found this root format and digest
mapping coherent, conditional on expected-root enforcement and state retention.
No immediate owner decision is needed for the reversible implementation.
