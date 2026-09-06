# C0 batch authority evidence: first executable boundary

**Status:** reversible composite/direct C0 framing input; pure Solidity encoder
and independent reader implemented, with task and final review closed at
`1ce66df`. Persistence and
authentication are not implemented; this is not a complete C0 module or
permanent protocol bytes. See [execution basis](authority-codec-verification.md).

This closes the retention format needed by the
[selected authorization/retry law](authority-order-and-evidence.md).
It leaves the state kernel's ordinary identities, batch partition and full
authority word unchanged. Session authorization needs a subsequent exact
grant/metering design; branch 3 is unsupported in this increment.

## One owner, one historical record

Core owns `mapping(uint64 => bytes) batchAuthorityEvidence` alongside, not
inside a second copy of, its existing `StateStore.Store`. Its key is the
kernel's positive accepting batch ID. Every fresh/mixed accepting batch has
exactly one immutable value. An all-reused call creates no value and cannot
replace an earlier value, even when another request uses the same Envelope.

The existing batch row owns its admission range, revision ordinal, block
number, full `authorityBasis` and conditional `authorityCodehash`. Retained
Envelope state owns the unsigned header and complete ordered RecordId vector;
Record state owns canonical bodies. The extension owns the otherwise missing
plan, witness and admission-time observations. Readers join these owners by
batch ID and the exact EnvelopeId in the effects, never by a mutable
Envelope-wide `valid=true` flag.

The authority word remains all 256 original bits. The proposed C0 authority
module revision is 2, verifier version `0xC001`, with distinct witness profiles
6 composite and 7 direct; these are disposable discriminators, not permanent
range allocations. Verifier 2 is already B0's reserved WebAuthn value. The
exact module/program serialization is a separate required input; this document
does not silently implement it by naming these values.

## Exact packed `BatchAuthorityEvidence/1`

All integers are unsigned big-endian with the printed width; addresses are
20 bytes and hashes are 32 bytes. Concatenation is packed, without ABI offsets
or padding. Reject unknown versions/branches, wrong lengths and trailing
bytes. The public write signature remains exactly 65 bytes for composite,
zero for direct; an internal witness tag is not an extra public signature byte.

| Order | Field | Encoding |
|---:|---|---|
| 1 | evidenceVersion | u16, exactly 1 |
| 2 | branch | u8: 1 composite, 2 direct; all others reject |
| 3 | Principal descriptor | exactly 22 bytes: `01 00` followed by the account address |
| 4 | WritePlan | 220 bytes, fields below |
| 5 | Realm effects | 241 bytes, fields below |
| 6 | expectedRevisionCount | u8, 0 through 64 |
| 7 | expected revisions | count repetitions of `leafIndex:u16 || revision:u32` |
| 8 | write witness | exactly 65 bytes for branch 1; zero bytes for branch 2 |
| 9 | actualSigner | address20 |
| 10 | submittingCaller | address20, observed `msg.sender` |
| 11 | transactionOrigin | address20, observed `tx.origin` |
| 12 | observedAccountCodeLength | u8, exactly 0 or 23 |
| 13 | observedAccountCode | that many bytes; if present, exact `ef0100 || delegate20` |
| 14 | admittedAtTimestamp | u64, checked before narrowing from EVM timestamp |
| 15 | previousSequence | u64, the preceding accepted value for this Principal/lane |

WritePlan uses exactly this order from
[C0 §4.1](../../Designs/efsv2/disposable-mvp-profile.md#41-one-composite-approval-and-publication-identity):

```text
c0ProfileId:32 || publicationDigest:32 || realmId:32 ||
realmEffectsDigest:32 || executor:20 || executorCodeHash:32 ||
nonceKey:24 || nonceSeq:8 || notAfter:8
```

Realm effects use exactly:

```text
realmId:32 || core:20 || routeConfigId:32 || genesisReceiptHash:32 ||
operationKind:1 || envelopeId:32 || leafMask:8 ||
expectedRevisionsHash:32 || stateByteStore:20 || byteCommitment:32
```

The fixed framing, excluding revision items, witness and code bytes, is
564 bytes. Maximum length is `564 + 64*6 + 65 + 23 = 1036` bytes.
Direct's code length must be zero and its witness is absent, so its maximum
is 948 bytes. These are format bounds, not measured gas/resource promises.
This grammar and maximum belong to the C0 admission/evidence owner overlay;
the AUTHORITY owner references its branch/program behavior without embedding
a competing copy. No new evidence ID or authority-local hash is necessary.

## Binding and independent reconstruction

Decode only after an input-length bound; test exact consumption. Before
claiming a complete batch reconstruction, a second reader must:

1. Validate the entire original three-field batch row, not just its meta
   word. Check the existing ordinal/block/revision guards and reserved bits.
   Match its kind/verifier/profile to the exact supported C0 module and
   branch. Both current branches require the original zero codehash rule;
   account delegation observations are not ERC-1271 codehash evidence.
2. Validate the canonical descriptor and recompute PrincipalId using the
   unchanged B0 identity rule. Join the batch's contiguous admission range
   to one Envelope; recompute its publication digest, EnvelopeId and every
   selected Record/Occurrence from retained exact bytes. A digest alone is
   not the missing original carriage.
3. Recompute the strictly increasing revision vector hash, every effects
   field, the WritePlan struct hash and its chain/Core-bound domain. Resolve
   profile, executor, code and operation/Route/genesis/carrier rules from the
   same retained run inputs. Signed vector carriage is not today's CAS.
4. For composite, independently recover the canonical low-s witness and
   match `actualSigner` to the descriptor account. For direct, require an
   absent witness, `actualSigner == submittingCaller == transactionOrigin`
   and the descriptor account, and zero observed code length. Composite's
   actual signer is not inferred from its relayer or payer.
5. Validate the exact zero/23-byte code observation and compare the delegate
   to the original basis word. A designator targeting zero is still a
   23-byte observation, not an empty-code observation. Never consult today's
   mutable account code as a substitute for the recorded historical input.
6. Require both branches' lane zero, a nonzero sequence equal to checked
   `previousSequence + 1`, and current-at-admission deadline compliance using
   the retained timestamp. Fold preceding accepting batches for the same
   Principal/lane to corroborate the claimed previous value; an isolated
   value is not proof of prior nonce state. Batch block number is unchanged;
   Core does not invent its own current block hash.
7. Independently derive the fresh selected subset from the batch range and
   prior lifecycle, with original receipts for already-active leaves.
   Reconstruct operation, Binding/CAS and carrier effects from their retained
   inputs at admission, not from the desired current head. This extension
   alone does not complete that operation interpreter.

`actualSigner`, origin, code and timestamp are captured observations, never
caller-supplied metadata trusted by Core. Stored observations plus matched
Core code establish source-qualified state evidence; they are not a consensus
proof. Direct does not acquire a detachable signature by storing its sender.
Stronger transaction contribution requires exact transaction/receipt/log
correlation at the admitted chain/block basis. Missing transaction history
leaves that dimension UNKNOWN without discarding otherwise verified state.

Missing required batch fields/bytes, prior history or basis produce an
appropriately partial result. Complete but contradictory substituted evidence
is INVALID. A complete *synthetic test-host* batch check is still not C0
authorization; its known fixture values must not be promoted into these real
authority profiles.

## Integration without a second authority store

Prepare bounded evidence bytes and validate every semantic input before
mutation. Read lifecycle to decide whether an accepting batch is possible;
terminal leaves refuse and all-reused calls use the selected no-consumption
path. For a fresh/mixed request, check the expected next batch slot is empty,
the sequence prestate and exhaustion bounds, and evidence length before
calling the kernel. All operation/Files checks must also have passed by the
kernel's first journal write, not merely after it returns.

Keep all nonce/evidence preparation in memory until the existing kernel has
completed its own plan and replay. In particular, consuming the sequence
before calling `admit` would put later kernel semantic checks after the first
wrapper write. The [concrete wrapper sequence](authority-module-boundary.md#concrete-sequence-around-the-current-admit)
uses its existing return value; it introduces no prepare/commit API. The
all-reused path still calls the kernel for persisted-Type/self-envelope
OCCREF validation and never allocates new evidence.

Persist the prepared extension at the actual returned batch ID in the same
transaction as the accepted sequence, kernel and carrier effects. Post-call
batch-ID/prestate checks may assert an already selected invariant, not make a
new semantic authorization decision. A failure anywhere reverts every EFS
store; no external authority callback can observe an intermediate journal.
The exact Files/carrier operation validators still need implementation and
measurement against the 397-byte admission-library margin. The current
all-in-one `admit` does not expose a prepare/commit hook and the nonce/evidence
join does not require one.

Provide a bounded state getter by positive batch ID. Existing batch counts
are the enumeration authority; zero/out-of-range is an error, not a receipt.
A known accepting batch with no extension cannot be reported as completely
authenticated. No additional mutable status bit, Envelope evidence index,
duplicate receipt history or cache service is needed.

## Next tests and learning

The next codec task must include independently framed literal vectors for
both branches; all field/width/length mutations; exact 0/64 CAS bounds; unknown
version/branch; short/surplus witness; and a designator-to-zero versus no-code
pair. A Solidity encoder and an independently written reader must agree on
bytes without sharing an expected-output encoder. Format correctness alone
does not test signature verification or an initialized C0.

Joined tests must cover multiple batches for one Envelope, mixed/all-reused
retry preserving old evidence, missing/substituted batch words, sequence
history, direct/composite lane sharing, same-block ordering and late
kernel/carrier/persistence rollback. Session is explicitly rejected rather
than represented by zero-filled grant evidence.

What could have gone better: the original batch reader enumerated all rows
but ignored two words while claiming COMPLETE. Enumerability and integrity
are different obligations. Keep a field-level ownership/check map in the
actual decoder tests, not another global `valid` label. SDK results should
expose authenticated basis and transaction contribution separately.

No answer is needed from James for this reversible codec increment. The
remaining product followup is still measured wallet/fallback availability;
session-grant UX and real provider accounting remain separate required work.
