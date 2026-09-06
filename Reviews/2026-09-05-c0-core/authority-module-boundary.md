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

### Exact rows for the next serializer

The following fills that row-level input. It does not claim a serialized or
executed module. Retain B0 §3.8's field framing, operand-type rows and
terminal-mode meanings. Use the existing eight operand types with widths
`1,2,4,2,4,1,1,1`; `U16` below is operand type2, `C` type4 CONST_REF_U16,
`E` type5 ERROR_REF_U32, `K` type6 KIND_U8, `P` type7 PROFILE_U8,
and `R` type8 RESULT_RULE_U8. Errors in steps are ordered operands, not an
additional OpcodeRow field. `semanticsCode=opcode`; only10/11/32 use version2,
every other row below uses version1. Rows are in ascending opcode order.

```text
opcode terminal operands                asciiName
 1     CONTINUE E                       V1_KIND
 2     CONTINUE C,E                     V2_ACCOUNT
 3     CONTINUE C,E,E,E                 V3_ORIGIN
 6     CONTINUE E                       ASSERT_PRINCIPAL_ID
 7     CONTINUE E                       WITNESS_NONEMPTY
 8     CONTINUE C,E                     WITNESS_MAX
 9     CONTINUE -                       DECODE_WITNESS
10     CONTINUE E                       CHECK_PROFILE
11     DISPATCH -                       DISPATCH_PROFILE
20     CONTINUE U16,E                   PAYLOAD_EXACT
22     CONTINUE E                       V_27_28
23     CONTINUE C,E                     LOW_S
24     CONTINUE C,C,C,C,C,C,C,C,E       ECRECOVER_VERIFY
25     CONTINUE C,E                     EIP7702_CLASSIFY
32     RETURN   K,U16,P,R               RETURN_BASIS
40     CONTINUE E                       C0_REQUIRE_EOA_KIND
41     CONTINUE C,C,C,C,C,C,E           C0_ASSERT_PLAN_BINDINGS
42     CONTINUE E                       C0_REQUIRE_CURRENT_DEADLINE
43     CONTINUE P,P,E,E                 C0_ASSERT_BRANCH_PROFILE
44     CONTINUE E                       C0_REQUIRE_LANE_ZERO
45     CONTINUE E                       C0_ASSERT_DIRECT_SENDER
46     CONTINUE E                       C0_ASSERT_DIRECT_ORIGIN
47     CONTINUE E                       C0_REQUIRE_DIRECT_EMPTY_CODE
```

Constants31–36 are CONCRETE/BYTES_FIXED, with names in this exact code order:
`C0_WRITE_DOMAIN_NAME`, `C0_WRITE_DOMAIN_VERSION`, `C0_WRITE_DOMAIN_TYPE`,
`C0_WRITE_PLAN_TYPE`, `C0_REALM_EFFECTS_TYPE`, `C0_EXPECTED_REVISION_TYPE`.
Their raw values are exactly the six source strings already specified above,
without NUL termination. OP41 references all six, in that order, and consumes
the twelve binding predicates below. Publication/Principal/profile derivation
domains stay with the encoding owner; the wrapper supplies only the expected
run-derived context after verifying that owning input, not caller-selected
domain constants. This module alone cannot complete that root/context proof.

The module therefore has five kind rows, nine witness rows0–8, four descriptor
fields, five basis fields, three constant types, two value states, nineteen
constant rows (1–13,31–36), eight operand types, twenty-three opcode rows,
two ACTIVE profile programs, four code tables and twenty-four errors. New
witness rows6/7 use verifier0xC001/kind1 with payload65..65 and0..0;
row8 uses verifier0xC001/kind1/RESERVED/payload0..0 and no program. Retain
`OriginRule/1`, `PrincipalKeyRule/1`, `AuthorityBasisCode/1`; replace only
`WitnessStatus/1` by `WitnessStatus/2` with the four rows0..3 stated above.

```text
common prelude, stepCount=12
 1 OP1  (E6)
 2 OP40 (E21)
 3 OP2  (C2,E12)
 4 OP3  (C1,E8,E7,E12)
 5 OP6  (E9)
 6 OP41 (C31,C32,C33,C34,C35,C36,E23)
 7 OP7  (E13)
 8 OP8  (C3,E14)
 9 OP9  ()
10 OP43 (6,7,E17,E16)
11 OP10 (E15)
12 OP11 ()

profile6, programVersion=1, stepCount=8
 1 OP20 (65,E10)
 2 OP22 (E11)
 3 OP23 (C12,E11)
 4 OP24 (C4,C5,C6,C7,C8,C9,C10,C11,E10)
 5 OP25 (C13,E4)
 6 OP44 (E22)
 7 OP42 (E24)
 8 OP32 (1,0xC001,6,1)

profile7, programVersion=1, stepCount=7
 1 OP20 (0,E10)
 2 OP45 (E20)
 3 OP46 (E19)
 4 OP47 (E18)
 5 OP44 (E22)
 6 OP42 (E24)
 7 OP32 (1,0xC001,7,3)
```

Program lengths, including each u16 step count but not the enclosing u32
length field, are146,105,75 bytes respectively. These are arithmetic inputs
for literal serializer tests, not proof that those bytes exist or execute.

New semantics are fixed: OP40 rejects a recognized non-EOA kind with E21(kind)
after OP1 has handled invalid kinds. OP42 accepts deadline0 or timestamp no
greater than deadline, otherwise E24(deadline,timestamp); a too-wide EVM
timestamp is an outer-boundary error before narrowing. OP43 first rejects an
external branch other than1/2 with E17(branch), then compares the decoded
internal tag with its first/second profile operand, yielding E16(expected,actual).
The wrapper constructs this internal frame; it is not another public witness
field or a session fallback. OP10v2 retains B0's exists/status/verifier/kind
check order, but checks the serialized module header's verifier. OP11v2 selects
only its matching ACTIVE serialized program; no algorithm fallback exists.

OP44 rejects nonzero Plan nonceKey with E22(nonceKey). OP45 compares descriptor
account with msg.sender, yielding E20(account,caller). OP46 compares caller
with tx.origin, yielding E19(caller,origin). OP47 observes caller code length
and requires zero, otherwise E18(caller); it executes/copies no code. OP32v2
uses its explicit verifier operand, which must equal the module header; the
unchanged basis-width guard belongs before return. New deadline/branch/caller
checks do not alter previous batch evidence or authorize all-reused shortcuts.

The serializer must reject altered counts, rows outside this exact closed inventory,
extra/reordered rows,
wrong operand widths or references, incompatible profile/version/kind returns,
unknown active programs and mismatch with the authority result namespace.
Do not apply reachability-based pruning to the deliberately retained historical
errors, unsupported witness rows or non-EOA kind metadata.
Implementations may compile these fixed checks rather than interpreting
caller-provided instruction bytes. A partial module must not advertise the
full bootstrap/session capability just because this finite program is complete.

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

On success OP41 assigns that recomputed WritePlan digest to the verifier's
sole digest register. OP24 consumes that register verbatim. There is no
independently caller-selected digest argument, alternative publication digest
or second hashing choice on the authentication path.

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

### Concrete sequence around the current `admit`

The source-reviewed nonce/evidence join needs no new prepare/commit interface.
Keep `AdmissionLibrary.admit` unchanged for the next measured wrapper fixture:

1. Bound, bind and authenticate the request without writes. Derive
   `VerifiedContext` internally and retain the exact linked-library check.
2. Read selected lifecycle into a bounded fresh mask/count, rejecting terminal
   states. This repeats classification only, not target/CAS/index planning.
3. If all are ACTIVE, still call `admit` once for its persisted-Type and
   self-envelope OCCREF guards. Require its zero accepting-batch result and
   return original receipts without fresh nonce/CAS/evidence-capacity checks.
4. Otherwise precheck the shared-lane sequence, operation-only rules, checked
   next batch ID and empty evidence slot. Prepare the entire bounded evidence
   in memory with actual observations and the saved previous sequence.
5. Call `admit` once for the sole Type/reference/CAS plan and replay. Do not
   write wrapper nonce, evidence or a storage lock beforehand: kernel semantic
   planning must not follow an earlier wrapper mutation.
6. After return, assert the preselected batch ID and unchanged nonce/evidence
   prestates, then persist only the already selected sequence and bytes. These
   are invariants, not an opportunity to add operation or authorization checks.

The kernel's current `planLeaf` consumes a selected ACTIVE Binding leaf's CAS
entry before skipping its effects. Keep the full selection and signed vector;
filtering ACTIVE rows would change the request and break mixed admission.
All-reused classification alone is insufficient to return success. The
wrapper owns the existing store and receives a batch ID already, so neither
a second store nor a new external planner transport is justified by this join.

The first joined falsifier must use legal operation shapes, not an arbitrary
kernel subset. Use two different existing files owned by the same Principal:

| Envelope leaf | Record |
|---:|---|
| 0 | ChunkTree C for the exact committed bytes |
| 1 | FileRevision RA for file A, content C, parent A's prior revision |
| 2 | FileRevision RB for file B, content C, parent B's prior revision |
| 3 | File-head BindingSet BA targeting RA, predecessor A's earlier head |
| 4 | File-head BindingSet BB targeting RB, predecessor B's earlier head |

Both prior head occurrences belong to earlier, different Envelopes. Admit
kind 9 with mask `0x0b` (0,1,3), CAS at leaf 3 and sequence `n+1`; then kind 9
with mask `0x15` (0,2,4), CAS at leaf 4 and sequence `n+2`. Each selection is
exactly ChunkTree + FileRevision + head rebind in the required order. The
second reuses C while RB/BB are fresh, producing one new batch and evidence
value. Both retain exact runtime Route/receipt/carrier commitments and verify
the same actual bytes. Advance A's head in a separate Envelope, then retry
the original A selection with its consumed sequence/stale CAS: all-reused
must preserve original receipts and perform zero writes.

Force final persistence failure on the mixed B attempt and require whole-call
rollback before retrying it. Trace the first write to challenge semantic
validation afterward. This is source-supported fixture design, not executed
C0 acceptance; Files fields/carrier validation, phases and session remain open.

Do not use two sequential revisions of one file inside this Envelope: the
second Binding's predecessor would refer to this same Envelope, which the
kernel rejects (and hash-committed self-reference cannot be assumed constructible).
This legal-shaped mixed case reuses an ACTIVE ChunkTree, **not an ACTIVE
Binding**. The latter remains a separately labelled synthetic kernel test
unless a legal C0 construction is demonstrated. G4's one-group write, G6's
two-leaf root and G7's two Plans provide no arbitrary-subset escape hatch.

## Next implementation inputs and acceptance

The first common-codec increment can implement the exact C0 hashes and
[packed batch retention](batch-authority-evidence.md) without pretending its
test context is an initialized run. Before joining real writes, finish:

- serialize/test the exact AUTHORITY rows above and finish outer admission guards;
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

The exact-row addition was independently source-reviewed against B0 §3.8 and
C0 §4.1: counts, operand/error order, semantics versions and program-length
arithmetic agree. Root clarified exact-inventory versus reachability pruning
and made OP41→OP24 digest dataflow explicit. This is written-input review,
not an executed verifier or encoded Codex artifact.
