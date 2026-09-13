# Independent fixture oracle boundary

September 12, 2026 · [[sdk-fixture]]/[[files-journey]] oracle; no SDK/Core
adoption

**Basis:** `b2cd79aa093374bf0d21426a76a794381c9dbc59` and
[[run-manifest]]. Arms B/C are provisional; manifests, ABIs, encodings and
vectors remain unpinned.

## Smallest useful boundary

Before seeing candidate verifier code, the reviewer freezes candidate-neutral
expectations and mutations. After [[run-manifest]] is sealed, they add
profile-specific extraction/decoding from its public manifest, with separately
hashed source and independently derived hand vectors. They never copy/import a
candidate verifier, SDK, generated code, resolver, validator, indexer or helper.
A manifest describes, never proves.

The sealed packet contains or marks unavailable:

- source commit/diff hash; compiler/fork/dependency locks; chain/Realm addresses;
  historical runtime bytes and code/account/storage proofs;
- transaction envelope (`from`, `to`, `value`, nonce, chain ID), raw
  body/action/signature/calldata, receipt/log/revert bytes, and block hash,
  header and time;
- exact ABI/schema plus Type, ID, signature, acceptance, Lens, index and limit
  commitments; every observation names source, basis and proof grade; and
- pre/post returns and state/proofs for Records, admissions/evidence,
  heads/history/nonces, counts/cursors, required indexes, bytes, export/import,
  and external account/validator dependencies at the acceptance basis.

Debug traces diagnose only; manifests and hashes are not underlying evidence.
Insufficient authenticated input names its RPC/manifest trust assumption and
leaves that axis `UNKNOWN` or `UNSUPPORTED`.

## What the oracle derives

Independent formulas and vectors recompute
content/subject/revision/action/evidence commitments, EOA recovery,
contract-witness grade, Type/bounds/references, CAS/replay, acceptance, query
coverage, File/revision/tag identity, Lens outcomes, byte integrity/availability
and pre/post effects. It separately grades source authorship/acceptance,
destination admission and destination selection. Conclusions cite exact bytes
and basis; missing evidence never defaults to success.

## Candidate adapter allowance

An adapter may losslessly batch slots/MUD rows, pointers, returns and cursors
while retaining raw coordinates/provenance. The oracle refetches the public
source. Adapters cannot inject answers or assert `VALID`, `COMPLETE`,
`SELECTED`, `ABSENT_PROVEN` or `COMMITTED`; native statuses stay tagged claims.
An onchain adapter is pinned, public and immutable, without an answer store,
admin path or offchain approver.

## Mutations and fault attribution

| Mutation | Oracle expectation |
|---|---|
| Flip one body byte, retain ID/evidence | Identity/integrity fails; signature/reference axes retain observed outcomes. |
| Change a committed action field under one signature | Binding fails; digest omission exposes under-commitment. |
| Claim `AUTHOR_B` from another actor | Author binding fails; copied evidence cannot rescue it. |
| Reorder batched RPC responses | Correlation by response ID gives the same result. |
| Omit/duplicate a row while claiming complete; cross basis/cursor | Coverage fails, or refuse/return `PARTIAL`/`UNKNOWN`; order is a multiset unless pinned. |
| Reverse Lens order | Apply the pinned rule; absent one, expose conflict. |
| Success receipt, missing head/index effect | Receipt stays observed; effect is not `COMMITTED`. |
| Lost broadcast response, later proven effect | Submission stays `UNKNOWN`; effect may be proven; never blind-retry. |
| Strip source proof; relabel acceptance as admission | Source grade weakens; no destination authority is created. |

For costs, match actor, action shape, body size and initial state: prove content
identity absent before `fresh` and present before `existing`; test exact retry
separately. A second-author, identical-body case tests semantic dedup: storage
may reuse, but evidence, admission, CAS/head/history and index effects are new.
A forced required-index failure leaves only prior facts.

Keep R (raw state), N (native claim), B (adapter claim), C (oracle result), M
(manifest) and S (independent requirement) separate. Behavior violating both M
and S, derived by C from R, is `CANDIDATE_DEFECT`. B alone differing is
`ADAPTER_DEFECT`; manufacturing means invented evidence or upgraded status. C
alone failing a known control is `ORACLE_DEFECT`; insufficient R is
`INCONCLUSIVE`. M omitting an unwaived S is `UNSUPPORTED/INELIGIBLE`.
Ambiguous/unpinned S, a checker-added assumption, or universal acceptance of a
must-fail case is `SHARED_ASSUMPTION_FAILURE`; confirm with another arm/manual
checker, with no pass.

## Unrelated Solidity consumer and cost

The consumer uses only a public candidate ABI or pinned adapter, its own decoder
and a real transaction. It is neither producer/System/admin, reads no private
slot/debug RPC and gets no offchain-approved answer. Compare at one graph
revision. Count all dependency deployment/code, calldata/returns, nested calls,
cold/warm reads and full receipts for success, conflict, unknown, unsupported
and revert. Record version, privilege/audit, upgrade/migration and ownership.
Show `eth_call` separately; amortize only after setup and break-even.

No code starts until manifests, ABIs, encodings and expected vectors are
pinned.
