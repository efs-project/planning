# C0 authenticated request: bounded standard calldata

**Status:** selected reversible input for the next joined-Core implementation;
ABI-size arithmetic checked, external decoder and authenticated execution not
implemented. This is not a permanent EFS interface or a complete C0 run.

## One call, existing identities

Use ordinary typed calldata for the C0 wrapper. Its proposed parameter order is:

```solidity
publishWithPlanC0(
    StateKernel.EnvelopeHeader calldata header,
    bytes32[] calldata recordIds,
    StateKernel.SelectedLeaf[] calldata selectedLeaves,
    StateKernel.ExpectedRevision[] calldata expectedRevisions,
    C0PlanCodec.Effects calldata effects,
    C0PlanCodec.Plan calldata plan,
    uint8 branch,
    AccountPrincipal calldata principal,
    bytes calldata witness,
    bytes calldata payload
)

AccountPrincipal = (uint8 authorityKind, bytes originRef, bytes accountOrKey)
```

The names/selector are run-local implementation inputs, not SDK public API
freeze. Preserve the existing tuple field order and widths. The SDK can expose
a small operation-oriented facade while producing this ordinary contract call.
This does not add a second user approval, publication signature, identity or
state planner. It does not select a relayer, session provider or wallet vendor.

Derive the unsigned publication digest and EnvelopeId using the completed
[common codec](authority-codec-verification.md). Derive the selected mask from
the ordered selected indexes, then compare the signed effects' mask and
EnvelopeId. Do not accept a second independently supplied kernel EnvelopeId or
mask. `StateKernel.Publication` remains an internal memory representation.

Keep the existing typed Principal input. It feeds the committed verifier's
checks directly and avoids a packed-descriptor parser merely to recover the
same fields. Successful EOA validation derives the unchanged 22-byte canonical
descriptor; the request itself is not a 22-byte descriptor. This costs 128 more
ABI bytes than a dynamic packed-descriptor input, explicitly included below.

Alternatives not selected:

- A nested B0 `EnvelopeWire` would give a direct `wire.length` check, but also
  needs decoding and enforcing empty historical witness/target-evidence fields.
  C0 reuses its unsigned identities, not B0's two-signature write entrypoint.
- A new packed request grammar would add another parser and SDK encoding
  surface before measurement demonstrates a need for it.

## Two different byte budgets

Keep 1–64 full RecordIds, 1–64 selected leaves, at most 64 CAS rows, and both
individual and aggregate carried-body limits of 8,192. Selected indexes are
strictly increasing, in range, and exactly the carried selection. Bound counts
before looping or allocating; sum lengths before hashing/copying bodies.

Also preserve the existing 16,384-byte publication-wire constraint by an
explicit conservative adaptation. Define `ceil32(x) = 32 * ceil(x / 32)` and:

```text
N = full RecordId count
K = selected/carry count
M = CAS row count
P = payload byte length
W = 544 + 32*N + 160*K + sum(ceil32(selectedBodyLength))
require W <= 16,384
```

`W` is exactly `abi.encode(EnvelopeWire).length` for the same header, full
RecordIds, parallel selected-index/body arrays, empty legacy witness and empty
target-evidence array. Its 544 includes the outer dynamic-struct offset,
11-word struct head and all five dynamic-tail length words. The empty legacy
fields have accounting overhead but no physical/public C0 argument. Do not
drop that overhead or put the C0 signature into the old witness slot.

This preserves the selected publication limit without pretending that `W` is
the actual C0 call length. For the parameter order above and a valid EOA input,
canonical standard ABI call lengths, **including the selector**, are:

```text
composite = W + 928 + 64*M + ceil32(P) + 4
direct    = W + 832 + 64*M + ceil32(P) + 4
```

The fixed argument head is 32 words. An accepted typed Principal's tail is
192 bytes; the composite witness tail is 128, direct 32. No file payload is
part of the publication-wire budget. The existing run-local
`maxStateFileBytes = F` provides the separate payload bound. Derive the outer
actual-call resource ceiling, in checked wide arithmetic, as:

```text
maxC0CallBytes = 21,412 + ceil32(F)
require msg.data.length <= maxC0CallBytes
require payload.length <= F
```

This is a conservative grammar ceiling, not evidence that its maximum can
execute within normal gas or that every count combination is a legal C0
operation. It derives from the same committed run file cap and versioned
request grammar, not a new independently configurable profile knob. A complete
run must still measure its actual 4/7/3-leaf operations and file-size candidate
under the normal transaction limit before claiming readiness. Do not raise
these limits to make an unmeasured operation fit or silently split it.

Source basis: [B0 authorship §2.2 and §2.5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-authorship-envelope.md)
and [C0 §§4.1,5](../../Designs/efsv2/disposable-mvp-profile.md).

### First implementation boundary: publication preparation only

Implement a small internal `C0Request` component before the authority join.
It consumes header/full IDs/selected leaves/CAS in calldata plus the actual
payload length and trusted run-local file cap. It returns the existing kernel
Publication, its unsigned digest and `W`, with EnvelopeId/mask derived rather
than caller supplied. It does not authenticate the Principal, compare signed
effects, interpret Files relations, write state, or advertise SDK readiness.
The test receiver has the full proposed parameter layout, but no mutation
entrypoint or authenticated-Core claim. The real wrapper must use the same
component before its ordered authority program, not bypass it.

Its exact refusal sequence is:

1. Actual `msg.data.length` above the derived cap:
   `C0_CALL_LIMIT(uint256 got,uint256 maximum)`.
2. Actual payload length above trusted F:
   `C0_PAYLOAD_LIMIT(uint256 got,uint256 maximum)`.
3. Header profile other than 1: B0 `E_PROFILE(uint16 got)`; then nonzero
   authorityRef/authEpoch: `E_RESERVED_AUTHORITY(bytes32,uint64)`.
4. Zero RecordIds: `E_EMPTY_ENVELOPE()`; more than 64: `E_LEAF_LIMIT(uint256)`.
   Zero or more than 64 selected leaves, or more than 64 CAS rows: `E_BOUNDS(1)`.
5. Scan selected leaves in order. Invalid/out-of-range/non-increasing index:
   `E_LEAF_RANGE(uint16)`; individual body above 8,192: `E_BODY_LIMIT(length)`;
   cumulative body above 8,192: `E_BODY_LIMIT(total)`.
6. After the full length/index pass, `W` above 16,384: `E_WIRE_LIMIT(W)`.
7. CAS leaf index outside 0–63 or non-increasing: reuse
   `C0PlanCodec.InvalidExpectedRevisions()`. Exact selected Binding coverage
   remains OP41, not a second state lookup here.
8. Only now hash each selected body and compare its positional RecordId:
   `E_BODY_MISMATCH(uint16 leafIndex)`. Use the existing Record preimage.
   Derive the publication digest/EnvelopeId via the common codec and build
   bounded kernel memory with the computed mask.

These are disposable outer-stage signatures, preserving existing B0 signatures
where their meanings agree. They are not new AUTHORITY error rows or an already
serialized result registry. Compiler framing refusals remain distinct from
these successfully entered application guards. All guard failures precede
kernel writes; no opaque error code is treated as successful preparation.

## Preserve authority error order without unbounded copies

The compiler handles invalid ABI scalars/offsets/inaccessible live data as
outer-framing failure; do not relabel that as a signature failure. The outer
boundary then checks actual-call size, bounded publication carriage and
payload length before body hashing or construction of kernel memory. Never
`abi.decode` a nested unbounded memory request as the first application step.

Keep all dynamic Principal fields in calldata through the exact
[committed prelude](authority-module-boundary.md#exact-rows-for-the-next-serializer):

1. OP1: kind outside 1–4 yields `AUTH_KIND_INVALID(kind)`.
2. OP40: recognized non-EOA kind yields `C0_AUTH_KIND_UNSUPPORTED(kind)`.
3. OP2: EOA account length must be exactly 20 and satisfy C2;
   otherwise `AUTH_STRUCT_INVALID()`.
4. OP3: nonempty EOA origin first yields `AUTH_ORIGIN_FORBIDDEN()`;
   C1's maximum is later, not a replacement for the presence check.
5. OP6: construct only `01 || 00 || account20`, derive PrincipalId from the
   unchanged domain/descriptor-hash preimage, and compare declared identity.
6. Continue OP41 and the subsequent witness/profile checks in their committed
   order. Do not move exact witness validation ahead of Principal equality.

In particular, do not copy an unsupported kind's arbitrary origin/key merely
to reject it, or give an eager C1/C2 check precedence over OP1/40. The actual
call-size guard is an independent earlier resource refusal.

For witness handling, the wrapper creates the branch's internal profile tag;
there is still only one external payload. Check the virtual internal-frame
length `1 + witness.length` against C3 at OP8 before copying/reading the payload.
That length is independent of branch support. Tag construction must not reject
an unsupported external branch early; its semantic refusal remains OP43.
Exact 65/empty
validation remains OP20 after branch/profile checks, not an outer semantic
shortcut. A recognized supported request yields only the already bounded
composite/direct evidence shape. Session remains unsupported here.

CAS bounds/order/coverage are checked for every selection, including ACTIVE
rows, against the pinned Binding TypeIds; values are interpreted only by the
existing sole kernel planner on its fresh path. Keep the selected
[wrapper sequence](authority-module-boundary.md#concrete-sequence-around-the-current-admit)
and its operation-before-replay / nonce-and-evidence-after-replay law.

For non-byte operations the payload must be empty; byte operations retain
their exact signed carrier commitment. The final operation guard must state
its retry behavior explicitly rather than treating this length guard as byte
integrity or accepting arbitrary fresh payloads. Actual carrier/operation
semantics are still an integration obligation, not closed by this document.

## Semantic values, not raw ABI identity

Use Solidity's ordinary decoder acceptance, plus the logical-size and actual
call bounds above. Do not require raw-calldata re-encoding equality for
Principal identity. Unused gaps, padding or suffix bytes accepted by that
decoder have no semantics and must remain within the actual-call bound.
Count each logical body even if two ABI offsets alias the same underlying
calldata bytes; aliasing must not evade the aggregate/padded-body budgets.
Inaccessible live values still revert. This policy does not relax canonical
Record body bytes, strict packed retained evidence, array order or widths.

The SDK emits canonical standard ABI. Recovery/authentication keys are the
specified publication/plan/effects commitments, not a hash of one arbitrary
transaction encoding. Any raw transaction digest remains transport evidence.

Solidity 0.8.30 documents that its decoder does not enforce strict ABI mode
although its encoder produces it; calldata avoids automatic whole-value
copies when kept in that location. These facts motivate the bounded scan,
not a claim that generated code needs no inspection. Verify the pinned
compiler's generated path and focused hostile-offset cases before joining
the real write. [ABI specification](https://docs.soliditylang.org/en/v0.8.30/abi-spec.html#strict-encoding-mode),
[data location](https://docs.soliditylang.org/en/v0.8.30/types.html#data-location).

## Measured arithmetic and next falsifiers

Root checked the following canonical encodings with the existing ethers 6.15
ABI encoder and an independently counted formula on 2026-09-05. This is
encoding arithmetic only: placeholder bodies/CAS rows are **not** legal Files
or authenticated execution fixtures. No Solidity receiver was run here.

| N/K/M | Body lengths | W | Composite call, P=0 | Publication budget |
|---|---|---:|---:|---|
| 1/1/0 | 1 | 768 | 1,700 | Fits |
| 64/64/64 | 64 × 128 | 21,024 | 26,052 | Refuse despite legal aggregate 8,192 |
| 64/64/64 | 1,505 then 63 × 1 | 16,384 | 21,412 | Exact framing boundary; not semantic validity |
| 5/3/1 | 128,256,128 | 1,696 | 2,692 | Fits; arithmetic for the legal-shaped mixed selection only |

Direct calls are 96 bytes smaller. The last row with a 4,096-byte payload is
6,788 composite / 6,692 direct. A 4,096-byte arithmetic sample is not a selected
run file cap or a successful carrier/gas measurement.

Implement the request boundary in the continuous Core track, then falsify:

- Body totals pass but `W` exceeds its cap; cap-1/exact/cap+1 rounded cases;
  actual-call excess, payload excess and an alias-amplified body vector.
- Publication count/body-length/logical-wire failures occur before body
  copying/hashing; invalid Principal fields are rejected before copying those
  fields; witness C3 overflow is rejected before copying that witness. Every
  failure precedes kernel writes. Inspect the pinned compiler's generated
  behavior/trace for each specific malformed-offset case, not just reverts;
  do not promise universal eager nested-ABI rejection.
- Same accepted fields with noncanonical ABI layout retain identical semantic
  hashes; extra bytes never become a second intent or bypass any budget.
- Kind 2 plus oversized key/origin within the call cap reports unsupported;
  kind 1 with valid key and nonempty oversized origin reports origin forbidden.
- Actual composite/direct signed writes consume this boundary, the common
  codec and one kernel planner; all-reused, mixed and final-persistence rollback
  use the source-supported operation fixture rather than generic kernel masks.

No new answer is needed from James. Remaining outer result-registry
serialization, operation error precedence, emitted capability bytes, carrier/bootstrap
and session implementation stay explicit next tasks. This decision chooses
the input shape and resource accounting; it does not claim those tasks done.

Independent source review agreed on shape, arithmetic and identity handling.
Root applied its two precision corrections: allocation claims are specific to
each field's guard stage, and branch-tag construction cannot bypass the
committed witness/branch error order. What could have gone better: distinguish
the input transport from the retained descriptor, and measure ABI overhead
before asking an implementer to invent a decoder or a total-call cap.
