# Exact bootstrap inputs still needed by the joined Core

**Status:** engineering refinement for the disposable C0 run; not a permanent Codex or a claim that these capabilities execute yet.

Source audit against `0b57513` found a real composition issue: the complete
B0 AUTHORITY module advertises active ERC-1271, P256 and RSA verification, while
the C0 control explicitly exercises composite EOA, direct EOA and a bounded
same-Principal session. Copying B0's active rows into an EOA-only runtime would
be a false claim, not a harmless unimplemented feature. The same B0 module
cannot mint while its ERC-1271 gas constant is measurement-pending.

## Run-local refinement

Build an explicitly versioned **C0 overlay**, not an unchanged B0 AUTHORITY
revision 1. Preserve the imported Record/Envelope/Occurrence identity formulas,
canonical EOA Principal derivation, exact unsigned publication fields, Type
grammar and required index/Binding behavior. Keep every required C0 journey.

The overlay's acceptance table must name composite EOA, direct-transaction EOA
and delegated-session verification and their distinct retained bases. It must
explicitly mark Stage A direct-envelope witnesses, ERC-1271, P256 and RSA
acceptance as unsupported in C0, rather than advertising them as active. The
unsupported verifier programs/constants are not executable C0 requirements; no
invented ERC-1271 gas value or pending placeholder enters a minted C0 module.
This implements the already bounded C0 scope; it neither rejects those future
EFS account capabilities nor expands this MVP into managed identity work.

Likewise, resolve the intrinsic inventory explicitly. C0's intrinsic bootstrap
meta-Type plus the sixteen G4 Types do not imply support for B0's four intrinsic
evolution schemas. Kernel Binding IDs must be derived from the actual G4
group-2 candidates, not separate singleton blobs. Keep the old run artifacts
and Type candidate bytes unchanged; new runtime semantics require a new run.

Pre-withdrawal needs the same explicit support treatment. B0 authenticates a
never-admitted target through `TargetEnvelopeEvidence` containing a direct
envelope witness; a C0 composite WritePlan signature is not that witness.
The first stateful module may exercise withdrawal of already-admitted targets
using their retained C0 authority evidence. It must reject a never-admitted
target until a bounded C0-authenticated evidence overlay is implemented and
independently tested. Do not infer authority from a bare target ID or silently
call the unsupported B0 verifier. This is an unfinished capability, not a
permanent removal of pre-withdrawal or a claim of complete B0 lifecycle support.

Also preserve C0's closed operation table. There is no generic public
`TOMBSTONE` or `WITHDRAW` operation in its nine current operation kinds. Test
the complete reusable Binding transition module through an internal-kernel
test harness; do not introduce a production `bind()` entrypoint or smuggle an
arbitrary mutation under a Files operation name. Required C0 Files paths and
their authenticated publication boundary are unchanged.

Index overlay work must carry `KIND_BINDING_SCOPE=0x0a` and its exact value-key
domain through the Codex, point/page/cursor decoders and RAW_AUDIT rules. Its
first-bind **and first-tombstone** admission anchor is appended exactly once,
never filtered or removed by lifecycle changes. Re-measure aggregate fan-out;
do not treat B0's estimated `F_MAX=44` as observed C0 cost.

This refinement selects the honest scope of the next disposable serializer,
not its unimplemented byte layout. Before deployment, freeze the actual
ordered tables, error/status/program rules and independent vectors, with
explicit source-to-overlay ownership. No source prose hash or nonzero dummy
commitment substitutes for the table bytes.

## Concrete input work, in dependency order

| Input | Already available | Work still required |
|---|---|---|
| Seed/deployment bytes | Independent packed JS/Solidity codecs and exact deployment framing | Supply complete real sources/toolchain/chain/capability/measurement inputs, then re-verify on the actual Core. |
| Encoding tables | Ordered domain, bounds, algorithm, field/selector/error/constraint grammars | Materialize exact C0 tables and declare every overlay difference once. Keep index-owned limits/codes out of duplicate encoding rows. |
| Authority module | B0 byte grammar and explicit C0 authorization obligations | Encode the C0 support table, exact verifier/basis rules, session-grant fields/ID/approval/metering and retained evidence. No unsupported path may appear ACTIVE. |
| Index module/capabilities | B0 index tables/cursor rules; C0 scope override; G3 family list | Implement every G3 family, exact capability entry ordering/root codec and declaration mapping. A documentary list is not an active capability. |
| Type-group root | Sixteen exact candidate blobs and per-group/member identities | Specify and independently encode the aggregate ordered group-root preimage. Preserve the 6/3/6/1 inventory and its source order. |
| Run bounds | Component-only carrier/schema measurements | Measure complete Core+carrier operations and the required read/proof/client costs before selecting valid immutable run bounds. |

## Source anchors

- [Encoding §1.6](../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md):
  outer Codex module ownership and no-placeholder rule; §3.4/§6 intrinsic IDs.
- [Authority §3.8](../2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md):
  active witness rows, byte-exact verifier programs and pending constant C16.
- [Indexes §0.1](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md):
  ordered index module and limits; C0 [Files §5](../../Designs/efsv2/hierarchical-files-and-folders.md)
  supplies the BindingScope override.
- [C0 §4](../../Designs/efsv2/disposable-mvp-profile.md) and
  [genesis G3/G4](../../Designs/efsv2/mvp-c0-genesis-manifest.md):
  current scope/authorization and required capability/Type inventory.
- [Admission §5.5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md)
  and [Binding §4](../2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md):
  authenticated pre-withdrawal and terminal occurrence behavior, qualified by
  C0 §4's explicit witness incompatibility and closed operation table.
- [Foundation run codec](../2026-09-04-mvp-c0-foundation/run-codec.md) and
  [measurement limits](../2026-09-04-mvp-c0-foundation/README.md):
  reusable exact encoding, not a completed or valid bootstrap report.

No owner question is needed for this refinement. The engineer implementing the
serializer must return exact bytes and executed coverage before calling G0–G3
complete. Public deployment, permanent support/profile choices and release
remain outside this run.
