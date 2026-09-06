# C0 authenticated writes: retry order and historical evidence

**Status:** selected reversible engineering refinement; source-reviewed, not executed authority coverage or a permanent protocol rule.

The stateful kernel's synthetic `VerifiedContext` belongs only to its test
host. The real wrapper constructs that context itself. This note closes
ordering and evidence decisions; complete AUTHORITY/session codecs remain
required before implementation can claim their capabilities.

## The inherited ambiguity

[B0 admission §§5.4–5.5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md#55-idempotent-retry-and-partial-failure-rules)
authenticates a separate publication witness before ALL_ACTIVE, then skips
current intent signature, expiry, nonce and CAS. [C0 §4](../../Designs/efsv2/disposable-mvp-profile.md#4-one-approval-write-law)
has one composite signature and explicitly checks current session permission.
No separate publication signature can replace that composite check. The old
Type probe's expired-retry behavior cannot silently settle this difference.

Select **current authorization for write requests, public historical reads**.
An expired/revoked session cannot use the write entrypoint, but anyone can
still read its earlier receipt without a wallet prompt. The alternative of
allowing inactive sessions a special retry permission adds another category;
reexecuting current nonce/CAS on all retries instead breaks idempotence.
Neither alternative is selected. Reading an earlier result is not submitting
a currently authorized request, nor does either reinterpret earlier validity.

## Selected ordering for the new C0 run

1. Decode bounded input and validate the intrinsic Principal, unsigned
   publication, full RecordId vector, selection and body commitments.
   Recompute publication/Envelope/Occurrence identities.
2. Bind every C0 §4.1 field exactly, including executor/code, current
   operation/Route/genesis/carrier rules and deadline equality. Validate the
   strictly ordered expected-revision vector and its signed hash. **Binding
   that vector is not comparing it with today's Binding revisions.**
3. Authenticate the selected branch below. Check current publication/plan
   deadlines before success; retain the ordinary zero-deadline sentinel where
   permitted, but an expiring session grant itself cannot be unbounded.
   Sessions prove exact grant/lane, allowed operation/root/Route and current
   expiry/revocation/limit eligibility. Never broaden permission implicitly.
4. Read lifecycle; any selected terminal source rejects. If all are ACTIVE,
   run persisted-Type structural/self-envelope OCCREF guards and return
   original receipts. Do not compare current CAS, require fresh sequence,
   replay effects, allocate a batch, replace evidence or mutate state.
   Session debit is zero: exactly exhausted allowance is not exceeded by zero.
   Invalid/overdrawn budget counters still fail; transaction gas is not zero.
5. Otherwise require fresh sequence and sufficient grant allowance. Walk
   selected leaves in order using the shared shadow: ACTIVE leaves remain
   effect-free; fresh leaves validate all Type/reference/operation/Files/CAS,
   bounds and effects before receiving prospective ordinals. Never silently
   omit a failed selected leaf.
6. After complete preflight, commit nonce, session debit, batch evidence and
   kernel/carrier effects in one reverting transaction. No new semantic
   decision or external authority callback enters kernel journal replay.
   Check exhaustion before increments; later EVM failure reverts EFS state.

These rules need new run/module bytes and tested first-failure precedence;
the old B0 module does not already encode them. The exact session metering
codec must specify zero and mixed-request debits. It must not pretend Core
observes full transaction gas or fees. Sessions remain NOT_IMPLEMENTED until
their units/checks exist. EFS rollback does not refund fees or restore the
chain account's transaction nonce.

## Branches and replay

| Branch | Identity and lane | Evidence grade |
|---|---|---|
| Composite EOA | Exact WritePlan, canonical 65-byte low-s signature, recovered signer-derived Principal, lane zero | `C0_COMPOSITE_EOA_V1` |
| Direct EOA | Principal derived from msg.sender, msg.sender == tx.origin, empty caller code, lane zero, no WritePlan signature | `DIRECT_EOA_TRANSACTION_AUTHORSHIP` |
| Session | Exact approved nonzero uint192 lane selects one immutable grant; session signature and same-Principal scope | `C0_DELEGATED_SESSION_V1` |

For composite EOA, derive the Principal from the **recovered signer**, not the
submitting relayer. Observe code per B0 §3.4: empty or exact 23-byte
`0xef0100 || delegate`, otherwise typed unexpected-code failure. Delegation
alone does not reject a valid key signature; never execute delegate code to
verify it. Author, actual signer and payer remain distinct.

The direct conjunction is deliberately narrower. Origin equality alone no
longer establishes a top-level call; empty code alone permits constructor
callers. Together with msg.sender-derived Principal they exclude those cases.
Delegated EOAs keep composite approval but cannot use this narrow direct
fallback. Never automatically clear delegation. A broader caller-authority
branch needs a different explicit evidence grade. This is an additional
direct-only restriction, not general authorization by tx.origin. See official
[EIP-7702 self-sponsoring analysis](https://eips.ethereum.org/EIPS/eip-7702#self-sponsoring-allowing-txorigin-to-set-code).

Retain B0's sequence convention: last-accepted starts zero, first effectful
request uses one, then checked `last + 1` with uint64 exhaustion refusal.
Composite/direct share Principal lane zero; sessions use their non-recycled
approved lanes. One mixed accepting batch consumes one sequence, not one per
leaf. Direct C0 has an explicit WritePlan sequence, not B0 implicit consent:
`(uint256(nonceKey) << 64) | nonceSeq` is nonzero even for lane zero.

All-reused requests may carry consumed sequences; append no batch and do not
substitute newly checked request evidence into original admission receipts.
Exact transaction/receipt/basis correlation establishes contribution, not
desired post-state or block equality.

## Historical evidence

Preserve the full B0 word:

`authorityKind:u8 | verifierVersion:u16 | witnessProfile:u8 | basisBlock:u64 | delegateOrZero:u160`

All 256 bits are occupied. Grant IDs and hashes of basis labels cannot replace
it. C0 needs explicitly versioned branch/program rows, not old direct-envelope
witness codes; EOA branches do not invent ERC-1271 contractCodehash values.
The separate, exactly encoded C0 extension is **per fresh accepting batch**:

- retained Envelope linkage, exact plan/effects/CAS carriage/signature bytes;
- actual signer, submitting caller, branch/program/revision and historical
  code/delegation observation;
- accepted lane/sequence and previous sequence; and
- session grant/EOA approval, immutable lane mapping, historical revocation
  and expiry context, budget-before/debit/after plus exact metering inputs.

One Envelope can have multiple accepting bases. No replaceable Envelope-wide
verdict, retry overwrite or later live-grant reinterpretation is allowed.
Core cannot know its current block hash during execution; independent reads
supply that hash and source/finality qualification. Direct evidence retains
caller observation, not an invented transaction signature. Stronger linkage
requires actual transaction/receipt evidence at the same basis; unavailable
history leaves that dimension UNKNOWN, not invalidating completed state
reconstruction or fabricating detachable authorship/consensus proof.

## Required falsifiers

| Case | Required result |
|---|---|
| Valid retry, consumed sequence, advanced head | Original receipts, zero nonce/batch/effects |
| Retry after applicable deadline or session revocation | Typed refusal; historical read still works |
| Pre-seal bootstrap request retried after seal | Current-phase refusal; original receipt remains readable |
| Invalid signature, all ACTIVE | Authentication failure, not early success |
| Valid session retry, zero remaining allowance | Zero debit if other current checks pass |
| Add one NEVER_ADMITTED source | Full fresh-sequence/effects/budget checks |
| Malformed/substituted CAS vector | Structural/hash failure even on retry, without current-head comparison |
| Direct write after composite | Same lane-zero sequencing, no implicit sentinel |
| Constructor/delegated intermediary in direct branch | Caller refusal, no second-prompt fallback |
| Delegated EOA valid composite signature | Key accepted with code observation |
| Same session key, different grants/lanes | No substitution or lane recycling |
| Multiple batches for one Envelope | Distinct immutable reconstructible evidence |
| Last leaf/carrier/evidence persistence fails | Whole EFS nonce/budget/kernel/carrier rollback |
| Same-block race | One transition; contribution bound to exact transactions |

## Next engineering

What could have gone better: the single-approval change should have brought
an explicit retry/permission matrix with it. Copying a successful old probe
would have hidden a different witness model and a late UX decision. Keep
current permission, historical validity and transaction contribution separate
in the wrapper tests and SDK result types from the beginning.

Specify/implement common authority codecs, exact C0 branch/error programs,
composite/direct wrapper and enumerable batch evidence; then exact session
grant/registration/revocation/metering codecs and tests. Unsupported paths
fail closed. No partial module or synthetic context can mint complete G0.
Four-component deployment, actual G0–G12 operation validation, Files and
SDK/static-SPA journeys remain required. No owner decision, permanent Type
bytes, public deployment or release is implied.

Followup for SDK integration: an expired/revoked retry should offer historical
read-back, not silently request a new wallet approval or report a new effect.
Followup for James at the eventual product review: the narrow direct fallback
excludes delegated-code EOAs; review measured availability before selecting a
permanent caller-authority surface. No answer is needed for this local run.

Review: read-only audit by `c0_authority_order` at `aff1f6f`; root independently
checked C0 §4, B0 admission/authority and the probe, selecting the explicit
current-deadline/narrow-direct choices. A scoped review of this written note
found no material contradiction and added the post-seal retry falsifier.
These wrapper falsifiers are not yet executed tests.
