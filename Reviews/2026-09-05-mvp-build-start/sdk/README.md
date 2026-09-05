# SDK ergonomics proof — lab only

This is disposable `efs-lab/1` engineering evidence over the unchanged prior
rehearsal SDK. It is not an adopted public SDK, a package release, a full C0
adapter, a Realm derivation, or execution of any of the nine M0 rows.

## Consumer surface

```ts
import { createLabReader } from './reader.mjs'
import { createLabClient } from './lab-only.mjs' // opt in to write capabilities

const reader = createLabReader({ deployment, readProvider })
const page = await reader.files.list({ directory, cursor: 0n, limit: 16, at: 'latest' })
const file = await reader.files.read({ id: fileId, at: 'latest' })
const record = await reader.records.read({ id: recordId, schemaId, at: 'latest' })

const client = createLabClient({ deployment, readProvider, walletProvider, relayProvider })
const plan = client.writes.plan({ operation })
const approved = await client.writes.approve(plan, {
  policy: { mode: 'relayed', account, submitter }, signal,
  decide: reviewExactPlan, // application-provided async boolean; never defaulted
})
if (approved.status === 'APPROVED') {
  const sent = await client.writes.submit(approved.approval, { signal })
  if (sent.status === 'SUBMITTED') {
    const result = await client.writes.verify(sent.submission, {
      at: 'latest', maxReceipts: 128, maxPages: 4,
    })
    // Only READ_BACK_VERIFIED + COMMITTED is verified effect, not sent/included.
  }
}
```

`examples.mts` contains executable consumer functions with partial/unknown,
cancelled/declined, ambiguous submission and independently verified branches.
The runtime test imports and executes them on a fresh loopback Anvil chain.
The caller supplies the actual approval callback; the test's explicit `true`
callback is synthetic fixture policy, not a production approval policy.

Every deployment must explicitly include `profile: 'efs-lab/1'`, positive bigint
`chainId`, `realmId`, addresses, ABI, run/root IDs and expected runtime hashes.
The realm label is explicit lab context, not evidence of full C0 Realm identity.
Construction and planning perform zero RPC/wallet calls. The reader rejects
signing/submission provider options and exposes no write capability.

## Responsibilities and evidence

| Local entry | Responsibility |
|---|---|
| `reader.mjs` | Reader-only capability projection with closed file/page/record requests |
| `lab-only.mjs` | Explicit lab adapter and opt-in plan/approve/submit/verify lifecycle |
| `*.d.mts` | Narrow consumer types, immutable opaque write handles, no unchecked generic record casts |
| Existing rehearsal `sdk/index.js` | Unchanged codecs, exact/pinned RPC reads, signature checks and independent read-back |

These are local file entry points, **not settled package names/subpaths**.
A future package should separate reader root, opt-in actions and EIP-1193
adapters; this proof has a monolithic underlying import graph (`reader` imports
the facade, which imports the old SDK/ethers). Zero wallet invocation does not
mean zero wallet code downloaded. No new dependencies or codec implementation
were introduced; this module can be bundled for a static browser, but this
round executes it in Node only, not a new browser bundle benchmark.

Page results are returned intact, including coverage, basis, continuation,
raw provider observations and suffix `PARTIAL`. File reads retain `raw.node`,
`raw.revision`, and `raw.bytes`; subsequent reads use the first resolved basis.
Typed records retain `raw.record`, `raw.bytes`, and `raw.typed`, validate the
expected schema, and recompute the requested record ID before exposing fields.
Fields remain `unknown[]`: the caller narrows its application shape, preserving
bigints. A friendly value requires actual FOUND/value/basis with COMPLETE/VALID
read evidence and verified bytes; schema validation is additionally required
for records. Missing value is **not** an absence verdict—inspect the raw reads.
Schema/identity mismatches add a reason without rewriting the raw evidence.

Write handles are client-local, immutable snapshots tracked by identity; a
plan can be reviewed once and an approval submitted once, including concurrent
or ambiguous attempts. Copying or JSON-importing an object cannot mint a
handle. `verify` may be repeated read-only; its entire original SDK result is
returned, including historical authority, currentness, finality, comparison,
receipt and all observations. Inclusion alone never becomes committed effect.

## Safety that deliberately costs more calls/typing

- `at`, page cursor/limit, verification bounds, full operation fields, account,
  path and relay submitter are explicit; no network, authority, nonce, deadline,
  signing, resubmission, paging or retry policy is inferred. The caller can use
  the existing lab codec helpers to construct exact input bytes.
- Approval policy and operation are snapshotted before awaiting user review;
  supplied read bases and deployment context are copied as well. Invalid JS
  callers get input checks, not just TypeScript guidance.
- `approve` checks abort before and after async application review and after
  wallet preparation. `submit` checks both its own signal and the original
  approval signal before invocation and consumes the handle synchronously.
- In the pinned old SDK, the first awaited operation in `prepareWrite` is the
  wallet signing request; the first await in `submitWrite` is the send request.
  There is no awaited deployment/RPC preparation gap before those calls in
  this revision. Provider invocation is the handoff boundary: cancellation
  cannot recall a prompt or transaction already handed to a provider, and a
  caller-owned provider's internal delays are not fenced by this facade.
- `UNKNOWN` after sending retains the prepared plan and original thrown error,
  including the SDK's request/response/error observation. It must not trigger
  automatic resubmission. Approval-provider errors propagate unchanged and also
  consume the plan; they are not reported as signed or committed success.

## Deliberately not solved here

The application still owns trust in deployment/runtime evidence and providers,
wallet/account selection, usable approval UI, nonce/deadline/CAS reads, finality
policy, pagination scheduling and completeness, resource limits, data display,
application schema narrowing, and reconciliation/persistence after ambiguous
submission. Opaque handles do not survive reload; durable evidence export and
recovery use the existing lower SDK, not an automatic facade retry.

The lab's raw continuation remains visible; there is no new `pin()` API or
opaque basis-bound continuation protocol. To request a next page, the caller
must explicitly retain the prior domain, basis and cursor. No unbounded list
helper is offered. The old child-domain issue is not hidden behind a friendly
child lookup: this facade exposes no child API. Typed-reference provider/revert
failures retain the old validator's UNKNOWN result, never inferred absence.
Sessions, grants, schema registration, C0 adapter implementation, arbitrary
codegen, SDK package adoption and production wallet tests remain held/outside
this lane. A future C0 adapter must be separately named and verified; passing
the same convenience signatures is not conformance.

## Reproduce

Run from the assigned planning worktree root, using the prior rehearsal's
installed Node/TypeScript/ethers dependencies, existing compiled lab artifacts,
and `anvil` on PATH. Tests create and tear down an ephemeral loopback-only chain;
they require no user wallet or external RPC. They do not rebuild/change the lab.

```sh
node --test Reviews/2026-09-05-mvp-build-start/sdk/facade.test.mjs
Reviews/2026-09-04-mvp-rehearsal/node_modules/.bin/tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext Reviews/2026-09-05-mvp-build-start/sdk/examples.mts Reviews/2026-09-05-mvp-build-start/sdk/negative.mts
```

Observed: **16/16 Node tests, zero failed**, including execution of TypeScript
examples; strict TypeScript exits **0** with nine expected-error negative
contracts. These tests reuse real SDK/contract behavior, with provider faults
only at the external RPC boundary. This is local lab evidence, not browser,
production, full C0, or an independent codec-vector proof.
