# C0 authority module and operation preflight boundary

**Status:** selected reversible architecture and draft serialization inputs;
not an encoded module, authenticated wrapper or complete C0 run.

This narrows the next implementation after the stateful reader. It consumes
[C0 §4](../../Designs/efsv2/disposable-mvp-profile.md#4-one-approval-write-law),
the [selected retry order](authority-order-and-evidence.md), and B0's existing
[AUTHORITY owner-module grammar](../2026-08-13-efs2-stage-a-corpus/chapters/b0-principal-authority.md#38-authority-codex-module--canonical-bytes-consumed-by-the-realm-profile).
No new interpreter, owner-module hash or generic validation framework is needed.
Compiled Solidity may implement the explicitly committed ordered programs.

## A distinct module, unchanged Principal identity

B0 OP10 requires verifier 1; OP11 dispatches only old profiles 1–4; OP32
returns verifier 1. Merely giving a C0 witness a new name cannot reuse those
bytes honestly. Select these run-local discriminators:

| Field | Value |
|---|---|
| authorityCodexRevision | 2 |
| accountPrincipalVersion | 1, unchanged |
| authorityVerifierVersion | `0xC001` |
| verifierVmRevision | 2 |
| new profile-program version | 1, qualified by its new profile/module |

`0xC001` is not a permanent allocated range. B0 verifier 2 already denotes its
reserved WebAuthn profile; do not borrow that value with a different meaning.

| External branch | Witness profile | Kind | Status | External signature |
|---|---:|---:|---|---|
| 1 composite EOA | 6 `C0_COMPOSITE_EOA_V1` | 1 | ACTIVE | exact 65 bytes |
| 2 direct EOA | 7 `C0_DIRECT_EOA_TRANSACTION_V1` | 1 | ACTIVE | exact empty |
| 3 delegated session | 8 `C0_DELEGATED_SESSION_V1` | 1 | RESERVED | no accepted payload/program |

Keep the five B0 kind/descriptor rows and complete basis layout. Keep old
witness rows 0–5 with their original names/verifier/payload metadata, but
profiles 1–4 become UNSUPPORTED in this C0 inventory. `WitnessStatus/2` adds
code 3 UNSUPPORTED; 0 INVALID, 1 ACTIVE and 2 RESERVED retain their meanings.
Profile 5 stays RESERVED. Non-EOA kind verification and old witness programs
are not advertised as ACTIVE merely because their descriptor classes exist.

The verifier's internal frame is `profileTag:u8 || payload`; the public C0
signature is the payload alone. Branch-to-tag mapping is fixed above, not
inferred from the Principal kind. Direct's internal tag is not a publication
signature. A session request fails explicitly before grant decoding while
the session program is absent. This partial module cannot mint a complete C0.

## Minimal program inventory

Retain used B0 constants C1–C13 at their exact old codes/bytes: descriptor and
witness limits, ECRECOVER target, complete secp256k1 definition, half-order
and EIP-7702 prefix. Omit unused C14–C30 from this versioned inventory rather
than inventing pending ERC-1271 gas measurements or enabling unused algorithms.
The full curve tuple is still referenced by unchanged OP24.

New concrete BYTES_FIXED constants 31–36 own respectively the exact C0
WritePlan domain name, version, domain type string, WritePlan type string,
RealmEffects type string and ExpectedRevision type string printed in C0 §4.1.
Their hashes are derived; do not store competing hash constants elsewhere.
Publication and Principal domains remain encoding-owned; run-derived values
are authenticated context, not global constants.

Retain only opcodes used by the new programs: 1,2,3,6,7,8,9,10,11,20,22,23,
24,25,32 and new 40–47. OP10/11/32 require semantics version 2:

- OP10 checks ACTIVE status, the selected module's verifier version and kind.
- OP11 dispatches only the serialized ACTIVE profile programs.
- OP32 has explicit operands `(kind, verifierVersion:u16, profile, resultRule)`
  and returns the unchanged full word; its result-rule meanings are unchanged.

New semantics codes 40–47, version 1, are respectively: require EOA kind;
fixed plan bindings below; current deadline; branch/profile match; lane zero;
direct sender equality; direct origin equality; direct empty code. These are
closed operations, not expressions executed from arbitrary supplied code.
Before encoding, the serializer must supply each exact opcode row's operand
schema and ordered error references; a list of names is not a program blob.

The ordered prelude is old OP1, new40, old2/3/6, new41, old7/8/9, new43,
OP10v2, OP11v2. Composite then performs exact-65, v27/28, low-s,
recover-and-match, bounded 7702 observation, lane zero, current deadline,
OP32v2 `(1,0xC001,6,1)`. Direct performs exact-empty, sender, origin, empty
code, lane zero, current deadline, OP32v2 `(1,0xC001,7,3)`.

Preserve B0 error codes 1–15. Append these signatures in unsigned-ASCII order
in the same newly versioned authority/result-registry namespace:

```text
16 C0_AUTH_BRANCH_PROFILE_MISMATCH(uint8,uint8) // expected, actual profile
17 C0_AUTH_BRANCH_UNSUPPORTED(uint8)
18 C0_AUTH_DIRECT_CODE(address)
19 C0_AUTH_DIRECT_ORIGIN(address,address)      // sender, origin
20 C0_AUTH_DIRECT_SENDER(address,address)      // declared account, caller
21 C0_AUTH_KIND_UNSUPPORTED(uint8)
22 C0_AUTH_NONCE_LANE(uint192)
23 C0_AUTH_PLAN_BINDING()
24 C0_AUTH_PLAN_EXPIRED(uint64,uint64)         // deadline, timestamp
```

Malformed outer framing and context-width/exhaustion guards remain explicitly
owned by the outer admission decoder/program. Their exact result-registry
rows and precedence must be supplied with that boundary, not mislabeled as
signature errors. No completed-module claim follows from this partial table.

## OP41 is identity/binding preflight, not a Files interpreter

Before OP41, the bounded outer decoder establishes the exact publication
header seam (`profile=1`, zero authorityRef/authEpoch), descriptor structure,
full 1–64 Record vector, selected index order/mask/carriage, positional Record
IDs, individual and aggregate body bounds, and sorted bounded CAS vector.
It recomputes the unsigned digest and EnvelopeId. The typed test host is not
that external decoder; the existing 16,384-byte EnvelopeWire bound must not
be mistaken for a measured whole-call ABI budget.

Freeze the following plan-binding predicate order:

1. Plan/effects Realm both equal retained Core Realm.
2. Effects Core equals `address(this)`; EIP-712 domain uses actual chain ID
   and Core, never caller-supplied domain context.
3. Plan publication digest equals the independently recomputed digest.
4. Publication and plan deadlines are equal; current-time check is later.
5. Effects Envelope and mask equal the validated publication/selection.
6. Operation code is supported in the current exact bootstrap/runtime phase.
7. Route rule, then genesis-receipt rule, match retained bootstrap state.
8. Carrier equals the retained manifest address; only kinds 8/9 have a
   nonzero byte commitment. Nonzero alone does not verify actual bytes.
9. Executor equals this direct Core and executorCodeHash equals current
   `address(this).codehash`. This is the selected C0 direct-Core convention,
   not msg.sender, the payer, a relayer contract or an unimplemented Router.
10. CAS carriage covers exactly the selected pinned BindingSet/Tombstone
    TypeIds, and its hash matches. Include ACTIVE leaves without comparing
    their old revisions/predecessors to today's head.
11. Plan C0 profile equals the derivation from retained experiment commitment.
12. Recompute/compare effects digest; compute the exact WritePlan digest.

Known kernel TypeIds for predicate 10 come from the trusted ordered group
inputs, even before group 2 has populated kernel storage. Caller Type labels
or uninitialized zero kernel IDs cannot decide CAS coverage. All-ACTIVE
requests still need this check; kernel retry currently does not sort/check
the supplied CAS vector itself.

`BOOTSTRAP_OPEN`, `RECEIPT_PENDING`, `RUNTIME_ACTIVE` are distinct.
Receipt-pending refuses every publication even though the seal was admitted.
G6's **two-leaf root creation** uses kind 2 before Route creation with zero
Route/receipt; it is not a runtime four-leaf child-directory operation.
Runtime kind 2 needs the active root/Route and its own shape. The complete
operation/cardinality transition table belongs to the next bootstrap guard;
do not substitute a blanket `sealed` boolean or universal seven-leaf cap.

## One state planner; bounded operation-only validation

The current `StateKernel.admit` returns only after it replays. It exposes no
prepared operation summary or public prepare/commit API. Validating a Files
operation after that return would preserve revert atomicity but violate the
selected semantic-decisions-before-write law.

Select **wrapper operation-only preflight** for the next finite C0 increment.
After authentication and lifecycle/fresh-sequence classification, check exact
operation shape, permitted related Records and byte commitments. Reuse body
validation/field readers; perform no second target/index/CAS shadow plan.
Then call the existing state planner once. ACTIVE retry handling must avoid
reinterpreting previously accepted operation effects against current heads.
The duplicate bounded structural decoding is an explicit resource cost to
measure on the actual operation shapes, not presumed free.

Alternatives not selected: a per-leaf guard inside the existing near-limit
library saves decoding but risks its 397-byte runtime margin; a new external
planner transport adds a second protocol; post-write semantic checks require
a different explicit law and observer/reentrancy analysis. Do not quietly
adopt any of those just to make one size test pass.

The current preparation helper returns references/keys/generic effects, not
all Files fields. Its output alone cannot prove the full operation. Measure
the wrapper with shared body readers first; if physical fit requires an
extra helper return, propose that one narrow typed boundary before changing
the pinned dependency/deployment topology.

## Next implementation inputs and acceptance

The first common-codec increment can implement the exact C0 hashes and
[packed batch retention](batch-authority-evidence.md) without pretending its
test context is an initialized run. Before joining real writes, finish:

- exact AUTHORITY opcode operand/error rows and outer admission guards;
- external request framing and total byte budget;
- per-operation shape/relationship checks, phase transitions and byte preflight;
- precedence of wrapper operation errors versus kernel Type/reference/CAS
  failures, and historical retry handling;
- actual source-derived Codex/deployment/bootstrap initialization.

Session grant approval, immutable non-recycled lane mapping, revocation,
historical evidence and fresh-only metering remain a separate required slice.
Until they execute, session is unsupported and full C0 minting is refused.

Independent read-only source audit found the B0 version mismatch and the
all-in-one planner seam; root checked the cited source and selected this
finite preflight approach. What could have gone better: specify the operation
check boundary when choosing the physical split, not after assuming the
returned result was a preflight object. No immediate owner decision is needed.
