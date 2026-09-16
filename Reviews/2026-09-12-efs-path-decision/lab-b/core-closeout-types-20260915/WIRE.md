# Disposable described profile 1 — literal-byte freeze

September 16, 2026. Experiment only; no permanent Type format or automatic
compatibility is adopted. This document and `vectors.json` are the handoff to
the independently written Task2 decoder, not an invitation to reuse the Solidity
parser or a fixture-name/Type-ID allowlist. Existing opaque Types remain opaque.

All integers below are unsigned, big endian. Concatenation has no alignment,
offsets, padding, terminator, or trailing bytes. Maximum descriptor4096/body8192
bytes. At most16 fields and8 required leading references. Bounds are inventory
ceilings, **not** a guarantee their Cartesian product fits the single300k call.

| Descriptor offset | Size | Meaning |
| --- | ---: | --- |
| 0 | 1 | codec version, exactly1 |
| 1 | 1 | wrapper profile version, exactly1 |
| 2 | 1 | custom ABI:0 iff custom hash is zero, otherwise exactly1 |
| 3 | 1 | field count0..16 (unit/marker requires exactly empty body) |
| 4 | 20 | nonzero EOA declaration key |
| 24 | 32 | nonzero namespace bytes |
| 56 | 32 | zero or mandatory custom runtime hash |
| 88 | 2 | retained semantic-description byte length, nonzero |
| 90 | length | semantic-description bytes; preserved verbatim, not fetched URL |
| next | 164 each | ordered field rows |

Semantic description is retained uninterpreted bytes (examples are English
UTF-8). Its truth/adequacy is not machine-proven. It should explain semantic IDs
and enum values. The descriptor commits these exact bytes, not normalized text.

Each field: fieldID32, semanticID32, kind1, optional1, width2, lower32, upper32,
referenceType32. IDs nonzero; field IDs unique, order significant (not sorted).
Semantic IDs may recur. Optional is0 or1. All irrelevant fields MUST be zero.

| Kind | Body | Descriptor constraints |
| --- | --- | --- |
| 1 REF32 | exactly32-byte existing Record ID | required; first fields only; width32; lower/upper0; nonzero exact reference Type |
| 2 BYTES32 | exactly32 bytes | width32; lower/upper/reference0 |
| 3 UINT | `width` bytes | width1..32; lower<=upper; upper fits width; reference0 |
| 4 BOOL | one byte0 or1 | width1; lower0; upper1; reference0 |
| 5 ENUM | one byte | width1; lower<=upper<=255; reference0; semantic bytes define meanings |
| 6 BYTES | u16 length then exact bytes | width0; lower<=upper<=8192; reference0 |
| 7 TEXT_LF | u16 length then exact bytes | as BYTES, each byte0x20..0x7e or LF0x0a |
| 8 TEXT_PRINTABLE | u16 length then exact bytes | as BYTES, each byte0x20..0x7e |

Optional non-reference fields start with one presence byte.0 means absent with
no payload;1 means the complete ordinary payload follows. Any other value
refuses. Optional REF32 is unsupported: no nullable references and no shift of
Ledger's existing leading checked-reference words. Text domains preserve the
existing Note text1..1024/LF and title1..64/no-LF cases, not a universal Unicode
policy. This codec does not implement strings by coercion, recursive types,
unions, unspecified enum values, or compatibility inference.

`shape=keccak256(abi.encode(keccak256("efs.lab.described-shape/1"),descriptorBytes))`.
Type and Record derivations remain exactly `Keys.sol`; reference Types are
derived only from the leading descriptor fields. `ruleId` is the reviewed
stateless wrapper's deployed runtime hash, not custom code. Descriptor has no
self Type ID, destination address, signature, local wrapper or binding.

Portable raw ECDSA digest:
`keccak256(abi.encode(keccak256("efs.lab.portable-type-declaration/1"),typeId))`.
Signature is r32/s32/v1, low-s, v27/28. No personal-sign prefix, chain, payer or
registry domain. Recovered signer must equal declaration key. This authorizes
the exact declaration, not authorship of data or policy administration.

Custom ABI1 is `acceptDescribed(address ledger,bytes32 typeId,bytes data,bytes32[] refs)`.
Both structure AND custom must accept. Custom must authenticate wrapper runtime
before trusting forwarded Ledger. Wrapper derives Ledger only from msg.sender,
enforces signed allowedLedger, and uses a bounded STATICCALL inside the one
300k mandatory budget. Canonical return is exactly one32-byte word equal1.

Custom local preimage is twelve ABI words, in order: hash of
`efs.lab.local-type-binding/1`, hash of `efs.lab.described-wrapper/1`, wrapper
runtime hash, wrapper creation-code hash, chainId, registry address, typeId,
allowedLedger, custom instance, custom runtime hash, custom ABI as uint256,
declaration key (binding authority). Its keccak is the raw signed digest and
CREATE2 salt; CREATE2 deployer is registry, initcode is the exact fixed wrapper
creation code with **no arguments**. Binding preimage/signature are retained.
Custom predicates may pin common wrapper runtime, never the future per-Type
address (which would create a fixed point). Binding never changes in place.

Custom-free uses registry's fixed shared wrapper; custom instance, allowedLedger,
bindingId, binding preimage and binding signature all zero/empty. Any relayer
can reuse the original portable declaration at a new destination. Custom
declaration retention is also permissionless, but a new local custom installation
still needs its exact local authorization. If that authority disappears without
retained destination authorization, interpretation remains possible and new
local admission is **not** claimed.

New described installation initializes policy row1 at current epoch without
bumping it, and advances catalogRevision. Identical relays are idempotent.
Legacy register and admin policy/role transitions retain epoch-changing behavior.
Opaque registration cannot gain this interpretation through a later sidecar.
`describedStatus`:0 means opaque/missing,1 retained declaration only,2 installed
described Type. Combine status0 with `typeInfo.registered` to distinguish legacy
from missing. Retained bytes alone never upgrade a legacy row, in either order.
