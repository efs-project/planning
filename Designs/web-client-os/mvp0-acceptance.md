# Web Client MVP0 — File Browser acceptance overlay

**Status:** draft — bounded product-pressure gate over disposable MVP-C0; not implementation, release, conformance, or freeze authorization
**Target repos:** planning, client, sdk
**Depends on:** [[../efsv2/disposable-mvp-profile]], [[../efsv2/mvp-c0-genesis-manifest]], [[../sdkv2/mvp-interface]], [[README]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-09-04

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/efsv2 #topic/read-path #topic/coherence

> **2026-09-04 scope update:** James has now authorized local disposable
> browser/SDK/Files/data/Arcade prototypes, not product repository creation or
> public release. The [workflow lab](../../Reviews/2026-09-04-mvp-rehearsal/README.md)
> exercises real local contract/browser interactions under `efs-lab/1`; it does
> not implement full MVP-C0. All nine tests below still require their exact C0
> inputs and remain NOT_RUN until that profile is executed.

## Purpose

MVP0 is the smallest observable File Browser pressure gate for one exact,
synthetic, local MVP-C0 run. It tests the five SDK seams through a clean guest
journey and three deliberately basic mutations. It does not authorize Web
Client code, a repository, public deployment, durable data, or adoption of the
disposable C0 mechanism.

The broader 929-line [[mvp-and-acceptance]] file remains a roadmap and freeze
catalog. It is not this gate.

## Fixed harness

Every test uses the same run namespace, manifest-pinned Realm/Core/profile,
Route, Mount, Plans, run-local byte carrier and limits, and qualification law
from [[../efsv2/disposable-mvp-profile]]. The ordered G0–G12 bootstrap in
[[../efsv2/mvp-c0-genesis-manifest]] must have activated runtime first, and its
required first post-genesis synthetic file supplies the initial guest fixture.
A test that changes canonical bytes, Type/index capability, `WritePlan`,
genesis, or result interpretation starts a new run rather than patching the
fixture.

The harness records wallet/provider calls, raw canonical inputs and outputs,
all qualification axes, carrier attempts, each distinct receipt, and the exact
read-back basis. Expected IDs and post-state are computed independently of the
SDK under test. Product labels may be friendly, but the Inspector/export keeps
the full evidence.

For M0-06 through M0-08, one trace record spans intent through canonical
read-back. It binds the exact `writePlanDigest`, imported `operationKind`,
predicted target/effect identifiers, and therefore the same retained operation
identity to the complete ordered wallet-provider method log,
prompt/non-prompt classification and total, every returned value/error, and
every applicable authorship, authorization, submission, EVM,
admission/effect, byte-store, and read-back receipt. The observed method list
must exactly equal the fixture's declared list; an unrecorded provider
interaction or a second product plan/operation in that trace fails the test.

### Setup and full first-use accounting

Routine traces begin only after explicit setup: the selected bootstrap EOA
is connected, the wallet is on the manifest chain, and, for M0-08, its bounded
same-Principal grant is canonical and independently read back. These are
preconditions, not free actions. Guest tests M0-01–M0-05 and M0-09 still make
zero wallet/provider touches; setup starts only on explicit write intent.

For each M0-06–M0-08 operation, retain linked setup, routine, and (when used)
revocation traces under the same `runId`, browser/wallet session, Principal,
chain/Realm/profile, and operation identity. Setup records connection,
network-switch/add-chain, permission/grant approval, registration/submission,
and grant read-back, including every method, prompt/non-prompt classification,
returned value/error, and receipt. Declare the ordered method list before each
phase; record actual provider-call totals and prompt totals separately for
setup, routine, and revocation. A reused setup/grant cites its original trace
and basis in this run; a preconnected wallet cannot erase first-use cost or
borrow setup evidence from another run.

For every operation, display both its incremental totals and its full
first-use totals: the latter sum the uniquely linked required setup traces
plus that routine trace, for provider calls and prompts independently. Shared
setup is attributed once in the suite-wide total, never omitted from an
operation's first-use cost. Show revocation separately and include it in the
full lifecycle total. Rejections, retries, and setup failures remain visible
and cannot be counted as routine success. The routine prompt budget is exactly
one message signature for M0-06, exactly one transaction for M0-07, and zero
wallet calls/prompts for M0-08; no numeric setup or first-use total is asserted
until the declared fixture's complete log supplies it.

## Nine observable tests

1. **M0-01 — clean guest route.** A fresh browser with no cache, service worker,
   account, wallet, Commons, hosted indexer, OS, or Data Explorer opens an exact
   MVP-C0 nested folder route through the File Browser. A throwing wallet stub
   observes zero access. The UI shows a useful qualified result and the
   Inspector exposes exact route inputs, raw bytes, domain, basis, and evidence.

2. **M0-02 — exact file and verified bytes.** From the same guest context, open
   an exact File/FileRevision, retrieve a bounded full body and nontrivial range
   from the manifest carrier, and independently match the committed
   `ChunkTree`/digest. Semantic identity, carrier, availability, integrity,
   returned-byte state, and range remain separately inspectable.

3. **M0-03 — qualified partial page.** Remove or interrupt one required
   `BindingScope` page in a second controlled read. Already observed entries
   remain visible, but coverage is `PARTIAL`/`UNKNOWN`, the missing continuation
   and cause are shown, and an empty page does not become `ABSENT_PROVEN` or a
   negative cache entry.

4. **M0-04 — qualified unknown.** Make the required committed basis, capability,
   or historical evidence unavailable. Exact read and page read return the
   imported `UNKNOWN` outcome/reason with raw attempts and every independent
   qualification axis intact; no fallback to `latest`, empty, or another Realm
   occurs.

5. **M0-05 — tamper rejection and eligible fallback.** Return wrong bytes from
   the first eligible carrier and correct bytes from a second controlled
   source. The first attempt records available/returned/failed-integrity, only
   the verified fallback reaches presentation, and FileRevision identity does
   not change. With the fallback removed, no bytes are rendered and the
   semantic File still does not become absent.

6. **M0-06 — relayed EOA small-file effect.** Create the suite's one small file
   through the normal path after the linked setup above. The complete routine
   wallet-provider log contains exactly the declared methods and exactly one
   prompt: the EIP-712 signature request
   for this operation's imported C0 `WritePlan`; it contains no wallet
   transaction prompt. A distinct relayer submits and pays. Every receipt and
   the independently recomputed File Object/charter, `ChunkTree`, initial
   FileRevision, DirectoryEntry, name-slot/file-head Bindings, byte commitment,
   verified bytes, point result, and qualified parent listing bind back to the
   same `writePlanDigest`, `CREATE_SMALL_FILE` operation, and provider trace.
   Each acknowledgement advances only its own stage; semantic effect remains
   `UNKNOWN` until that same operation's matching canonical read-back produces
   `READ_BACK_VERIFIED` and `effect=COMMITTED`.

7. **M0-07 — direct EOA empty-directory effect.** With relay or typed-data
   support unavailable, create the suite's one empty directory after linked
   setup. The complete routine wallet-provider log contains exactly the
   declared methods and exactly one prompt: the direct transaction request;
   it contains no preceding
   `WritePlan` signature request. The result says
   `DIRECT_EOA_TRANSACTION_AUTHORSHIP`, `EXPERIMENTAL_DIRECT_CORE`, and
   `filesPreconditionCertified=false`; it never claims portable authorship or
   certified Files routing. All transaction/admission receipts and the
   independently recomputed Object/Record/Occurrence, charter and name-slot
   Binding effects, expected revisions, parent point lookup, and qualified
   listing bind to the same `writePlanDigest`, `CREATE_DIRECTORY` operation,
   and provider trace. Transaction approval or execution remains non-semantic
   until that exact operation's matching canonical read-back.

8. **M0-08 — zero-prompt session revision effect.** In the linked setup trace,
   the bootstrap EOA grants the bounded same-Principal delegation in
   [[../efsv2/disposable-mvp-profile#4.3 Same-Principal delegated-session path]].
   Canonically establish and independently read back that grant, then publish
   the suite's one second immutable revision of M0-06's File. The complete
   wallet-provider method log for this routine operation is empty: zero calls and zero prompts after
   the prior grant; the separately recorded session-key signature is not hidden
   or called a wallet prompt. Client and Core check profile,
   Realm/Core/executor, Principal/root/Route, operation, nonce, expiry,
   revocation, and byte/value/gas ceilings. Every receipt and the recomputed
   file-head expected revision, new immutable FileRevision, selected head,
   verified bytes, and still-readable prior revision bind to the same
   `writePlanDigest`, `PUBLISH_FILE_REVISION` operation, and empty provider
   trace. Bundler/relay or transaction acknowledgement remains non-semantic
   until matching canonical read-back. A stale revision rejects rather than
   replanning; after revocation, an otherwise valid attempt with fresh nonce
   and current CAS fails explicitly without widening or silent wallet fallback.
   Independently verify the retained grant
   approval, session signature, and `C0_DELEGATED_SESSION_V1` authority basis;
   the actual session signer differs from the bootstrap EOA, but the declared
   `bootstrapPrincipalId`, both immutable Plan IDs and contents, File Object,
   and existing file-head Binding author/key identity remain unchanged. Its
   head value/revision advances by the ordinary CAS rule, and the prior
   revision remains readable. Reject an ungranted signer, substituted Principal
   or grant, changed Plan/root/Route/profile/executor, invalid signature, stale
   nonce, expiry, unavailable authority basis, revocation, or exceeded budget;
   no such attempt may mutate the head or widen a Plan. Isolate each negative
   case against otherwise valid inputs so another failure cannot mask it. Retain each negative
   attempt and any setup/revocation prompts in the linked lifecycle log.
   Revocation rejects later writes without invalidating the already admitted
   second revision or its historical authority receipt. This is a
   same-Principal session control, not arbitrary smart-wallet interoperability
   or full account abstraction.

9. **M0-09 — clean-browser reopen.** Delete all browser state and open the
   exact folder, file, and revision links produced by M0-06 through M0-08 with
   no wallet or Data Explorer. The File Browser independently derives the same
   semantic IDs and returns the same qualified folder result, selected
   revision, and verified bytes at the cited bases, subject only to honestly
   reported later-basis finality/currentness observations.

## Pass rule

All nine tests pass in the declared browsers and independent oracle. Any
missing raw bytes or qualification axis, mixed basis, hidden provider/wallet
touch, unlabelled fallback, non-atomic planned effect, prompt overrun, false
absence, tampered presentation, or success before matching read-back fails the
gate. A passing gate supports only the next disposable experiment review.

## Outside MVP0

- Arcade and all other domain applications;
- rich or executable Views and Data Explorer packaging;
- KEL, recovery, managed-Principal migration, and full account abstraction;
- native mounts and three-host packaging;
- rename, move, delete, sharing, collaboration, batch editing, and offline
  write queues;
- a production large-file carrier or permanent file/range size policy; and
- public/testnet deployment, durable user data, production security,
  compatibility, or protocol freeze.

These are deferred, not silently solved by MVP0. The long-form
[[mvp-and-acceptance]] catalog preserves the relevant future gates.

## Open questions

No new product or protocol choice is requested. The gate stays blocked on the
upstream MVP-C0 execution/evidence questions and explicit implementation
authorization.

## Pre-promotion checklist

- [ ] All nine test procedures have deterministic fixtures and independent expected values
- [ ] `**Target repos:**` confirmed
- [ ] Upstream MVP-C0 dependencies accepted or explicitly retained as disposable inputs
- [ ] No `<!-- AGENT-Q: -->` comments remain
- [ ] At least one independent SDK and product review is recorded

## Implementation notes

No product implementation is authorized by this overlay. If a disposable UI
fixture is later approved, it must remain namespaced to the same C0 run and
must be destroyed or retired under the upstream rules.
