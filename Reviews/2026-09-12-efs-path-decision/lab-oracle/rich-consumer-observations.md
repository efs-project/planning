# Disposable richer Consumer observations

This separately named supplement implements only the predeclared
`05:25 UTC` richer-observation section of `oracle-implementation-plan.md` at
planning commit `1efcfec`. It does not modify or supersede the strict oracle,
the earlier `RPC_OBSERVED` probe, the signature-binding probe, their profiles,
or their retained reports.

The interpretation profile was frozen before tests or implementation at Git
blob `367c836d1952c19c16b3bdf6738675e3ea91233d` and local commit
`6ab1d80ea0be1fa5d67e8d08607ac4696775e430`. It associates the prospective
measurement with reviewed repair
`e77f36dd7a0352a09a5198207fd1c3a56b2e0a63` without inspecting that source,
and retains Core source association
`dcc7b946d2ac8dfcf22103069127a9d1809df974`. These are coordinator evidence,
not authenticated deployment or chain claims.

## Exact scope

The supplement accepts raw observations only for the storing `Consumer` in:

- `native-one/quote`
- `signed-one/quote`

For each cell, it requires exactly seven no-argument getter calls at each of
two actual transaction receipt block-end bases:

- paid `readQuote`: `lastAdmission`, `lastCount`, `lastRevision`,
  `lastScanned`, `lastStatus`, `lastTarget`, and `lastValue`
- `readList`: the same seven getters

The caller must supply an independent Consumer address **for each cell**, plus
exact query coordinates and a non-empty value-source label for each stage.
A global target and packet fields never become those pins. Every retained raw
entry is validated before stage selection. Missing evidence is `UNKNOWN`;
malformed fields, duplicates,
undeclared selectors, substituted calls, coordinate/target/source differences,
off-basis calls, request/reply disagreement, and conflicting block hashes are
`OBSERVED_MISMATCH`. No conflicting input is filtered away.

The public analyzer accepts the exact frozen profile bytes and ABI-profile
bytes, hashes and parses them internally, and only then reads untrusted packet
evidence. Caller-supplied parsed profile objects or hash strings cannot attest
to those inputs; altered trusted bytes fail the pinned-input boundary. In
contrast, malformed untrusted packet, cell, raw, transaction, request, or
response containers produce qualified mismatch reports rather than throwing.
Absent carriers or fields remain `UNKNOWN`, but never suppress validation of a
present malformed peer. Duplicate IDs are detected across every valid present
flat, request, and response ID even when either peer is absent; identical IDs
within one observation are counted once before cross-observation comparison.

Raw collection consistency and semantic interpretation are separate. Only four
semantic comparisons were frozen:

- paid quote `lastTarget` equals the independently derived quote-3100 Record ID
- paid quote `lastRevision` equals `2`
- paid quote `lastValue` equals `3100`
- listing `lastCount` equals `1`

Every other getter/stage meaning remains explicitly `UNKNOWN`, even when its
ABI bytes are present and internally consistent. The quote Record comparison
is independently recomputed from the frozen raw body and domain strings;
published comparison values are never used as the computed answer.

## Evidence boundary

The highest possible raw result is `RPC_OBSERVED`. It is not RPC honesty,
inclusion or canonicality, transaction-index-local state, runtime/storage
proof, historical source authority, immutable Type/body meaning, semantic
`COMMITTED`, or candidate `PASS`. `candidatePass` is always `NOT_EVALUATED`.

There is no current B packet for this supplement, no real-packet report, and no
CLI that could be mistaken for a candidate verdict. The module is a disposable
interpreter ready for a future independently pinned packet. Its synthetic test
suite is adversarial implementation evidence only.

## Check

From the planning worktree root, using the already present ethers dependency:

```sh
NODE_PATH=../contracts/node_modules \
  node --test \
  Reviews/2026-09-12-efs-path-decision/lab-oracle/rich-consumer-observations.test.mjs
```

The tests cover the positive seven-getter matrix; exact byte-boundary sealing;
explicit unknown semantics; altered pinned body rejection; missing and wrong
per-cell independent pins; altered
inherited and uninterpreted values; omitted, duplicated, substituted, and
off-basis getters; block-hash conflict; malformed containers and entries;
missing-versus-conflicting nested JSON-RPC fields; envelope and flat duplicate
IDs; and duplicate paid transactions.
