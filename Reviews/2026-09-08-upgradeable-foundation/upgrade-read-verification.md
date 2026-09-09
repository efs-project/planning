# Populated upgrade reads: verification and performance

**Status:** source task reviewed at `bcd0643`, local test configuration at
`45f3667`; fresh parent integration passes; final whole-increment review
approves experimental publication through `66f9da8`.
Disposable local evidence, not full Files/C0,
SDK/SPA integration, public deployment or permanent protocol approval.

## What this adds

Point, Binding, audit-page and B0 Lens reads now run on the **same populated
Store behind the upgradeable Core proxy**. The active execution identity
qualifies the observation. Original accepted batches retain their original
revision and codehash. Neither is silently substituted for the other.

There are two fixed read libraries: Point and UpgradeQuery. The source-derived
Core runtime embeds their linked addresses and expected immutable hashes;
the unchanged 21-word execution history commits that Core codehash. The
independent reader also checks the expected read-library runtimes. These are
trusted DELEGATECALL implementations, not sandboxed plugins.

Every new state-read checks both read dependencies, then the original active
execution/configuration chain. The old direct revision-one hosts remain
controls. Pure Binding-key derivation remains available without those guards.
No Store layout, writer, admission rule, controller, carrier or original
independent state/upgrade verifier was changed by this read increment.

## Actual journeys and refusals

- Real candidate Types, File/Directory facts, ordinary Plans and Binding
  sources are admitted, not inserted through a fake browser tree. Two initial
  Principals sharing low address bits remain distinct; wider controls admit
  64 actual authors.
- A-first/B-first/EXACT/THRESHOLD, full target kind/ID/leaf equality, strict
  acceptance, malformed/unsupported Plans and historical heads agree with
  independently reverified retained evidence and its separate pure model.
- U1 → U2 activates with unchanged admission H=88. Old raw/hydrated cursors
  refuse at the new observation but reproduce their U1 continuation at the
  old canonical block. U2 accepts at H=89; another activation changes the
  execution identity at that same H, and U3 then accepts a new fact.
- Original U1 batch rows remain byte-identical and independently verifiable.
  Zero Store writes are observed during ordinary and actual STATICCALL reads.
- Missing/substituted read dependencies, Preparation replacement, wrong
  expected code, missing/wrong history, forged VERIFIED labels/folds, mixed
  block pins, changed bytes, bad peer/admin/controller configuration and a
  partial upgrade refuse qualification. Corruption injection is not normal
  performance evidence. Managed chains stop on success and thrown consumers.

**Not implemented:** a revision-aware `getReceipt` on this new façade. The old
getter has a revision-one-only acceptance policy, so exposing it here would
mislabel history. Raw batches plus the unchanged independent upgrade reader
remain the qualified historical test path. Files profile/charter/router
validation, complete resolved directory rows, tags/filters, actual wallet
consent and the shared SDK/static SPA remain separate joins.

## Normal resources

The worker and fresh parent source-pinned runs reproduce the following.
Runtime limit 24,576 bytes, full initcode limit
49,152 bytes and actual transaction limit 16,777,216 gas remain unchanged.
Full initcode includes constructor arguments.

| Component | Runtime bytes | Full initcode bytes | Deployment gas |
|---|---:|---:|---:|
| Upgradeable read Core U1 | 20,478 | 21,421 | 4,521,518 |
| Upgradeable read Core U2 | 21,035 | 21,978 | 4,642,031 |
| UpgradeQueryReadLibrary | 19,303 | 19,333 | 4,227,218 |
| PointReadLibrary | 12,103 | 12,133 | 2,670,670 |
| Unchanged UpgradeAdmissionLibrary | 24,533 | 24,565 | 5,358,594 |
| Actual STATICCALL consumer | 420 | 446 | 144,233 |

U2 Core has 3,541 bytes of runtime margin; Query has 5,273. The admission
writer still has only **43 bytes**. The read split does not create writer
headroom. Proxy/admin deployment is charged within atomic pair bootstrap,
not allocated fictitiously to individual subdeployments.

| Query | Direct transaction gas | STATICCALL work | Consumer transaction gas | Return bytes |
|---|---:|---:|---:|---:|
| Agreement, 1 author | 211,213 | 192,017 | 215,535 | 448 |
| Agreement, 8 authors | 340,803 | 321,607 | 345,125 | 448 |
| Agreement, 32 authors | 845,469 | 826,273 | 849,791 | 448 |
| Agreement, 64 authors | 1,663,733 | 1,644,537 | 1,668,055 | 448 |
| Raw page, one item | 179,971 | 160,480 | 184,247 | 288 |
| Hydrated page, one item | 241,366 | 221,930 | 245,752 | 576 |

The measured U1/U2 gas and return sizes are identical. Page rows are partial
over two real Binding-history anchors; they are not complete Files rows.
Lens calldata is 68 bytes, page calldata 228. Setup admissions are separate
from these read costs. Guest `eth_call` reads do not require a wallet/payment;
transaction probes measure contract work, not mandatory browser transactions.
These numbers are not a matched v1/v2 ratio or a full wide-folder benchmark.

## Tests and review

Worker final source results: **200/200 Core Forge, 19/19 foundation Forge,
196/196 broad Node**, no failed/skipped tests. Independent task review approves
spec compliance and quality with no Critical/Important findings. It checked
unchanged execution/configuration and independent-component qualification
dependencies, not just wrappers. Existing compiler/lint warning debt remains
visible and is not claimed fixed or suppressed.

Parent independently forced both normal AST/build-info builds, then reproduced
**200/200 Core Forge, 19/19 foundation Forge and 196/196 broad Node** checks.
The foundation suite also passes with `FOUNDRY_CONFIG` and
`FOUNDRY_FS_PERMISSIONS` explicitly removed. Independent task review approves
the one-line configuration repair; effective settings and all 70 compiled
deployed-runtime objects are unchanged except the intended read permission.

The fresh [retained evidence](upgrade-read-evidence-20260909.json) names source
commit `45f36678617a12c97b6d75817087a0dba4899c69`, with a clean tracked
source-path diff. Parent rechecked all **41 Solidity and 15 support-source
pins** against disk. Its 4,731,006 bytes have SHA-256
`77fb198747622f896a9c7155907d9a3ce85e1552745fdd9f55b161c04e39c3c7`
and keccak-256
`0x1ccbc44145377e54c074f081a22e2aa3c8e551634444f15f179df889009f5683`.
All five retained snapshots independently reverify: U1/H88, U2/H88,
U2/H89, U3/H89 and U3/H90. All 12 normal query measurements and all 13
deployment runtime/hash inventories reproduce the worker run. The managed
chain stopped normally. Final full diagnostic collection accounts for 1,628
Core reads/612,864 JSON-result bytes plus 20 execution reads/13,593 bytes;
this is not a guest folder-open path. Both historical performance JSON hashes
and their original source/evidence boundary remain unchanged.

### Final whole-increment review

A fresh independent reviewer approved the complete range
`72b59b0557e52ab1f98232094ed70508e811924c` through
`66f9da85ed29a84062118a8facf92333a5e43098`, including implementation, test
configuration, design/plan, performance evidence and consumer maps. There
were **no Critical or Important findings**. Unchanged compiler/lint warning
debt remains a nonblocking, explicitly deferred maintenance item.

The reviewer independently checked all 41 Solidity/15 support pins, the
retained report hash, all 12 measurement-to-transaction-receipt links,
observation identities and five transitions, historical Core commitments,
fixed dependency embeddings, protected-source/old-JSON preservation and
cleanup. It inspected the parent's fresh suite logs without duplicating
the same suite runs. The read dependency guard order, explicit cursor context,
reverified oracle and narrow comparator/configuration repairs were also
checked against their unchanged dependencies. No fix wave was needed.

This closes the experimental-branch publication gate, not the MVP, a main
merge, public deployment, permanent execution/Type/ABI choice or Files/SDK/SPA
completion. The following closeout edits record this review only; runtime,
tests and retained evidence remain exactly as reviewed.

### Reproduction

Use the existing installed toolchain: Solidity 0.8.30, Cancun, optimizer 200,
viaIR; Node 26.0.0, Forge/Anvil 1.7.1 and ethers 6.15.0. From each of the
Core and foundation experiment directories, run the following with `EFS_SOLC`
set to the installed 0.8.30 compiler binary. No scratch config is needed.

```sh
env -u FOUNDRY_CONFIG -u FOUNDRY_FS_PERMISSIONS forge build --force --offline --use "$EFS_SOLC" --ast --build-info
env -u FOUNDRY_CONFIG -u FOUNDRY_FS_PERMISSIONS forge test --offline --use "$EFS_SOLC"
```

From the planning root, leave saved evidence exports disabled to preserve the
historical reports:

```sh
EFS_TASK3_EVIDENCE=0 EFS_FILES_PERF_EVIDENCE=0 EFS_FILES_PERF_OPTIMIZED=0 EFS_UPGRADE_EVIDENCE=0 \
node --test --test-concurrency=1 \
  Reviews/2026-09-05-c0-core/test/*.test.mjs \
  Reviews/2026-09-08-upgradeable-foundation/test/*.test.mjs \
  Reviews/2026-09-09-files-parity-performance/*.test.mjs \
  Reviews/2026-09-05-c0-admission/integration.test.mjs \
  Reviews/2026-09-05-mvp-build-start/type-inputs/*.test.mjs
```

For a separate new read report, additionally set `EFS_UPGRADE_READ_REPORT`
to a fresh filename; do not overwrite the retained checkpoint. To replay the
saved evidence offline, load that JSON and apply `verifyUpgradeState(snapshot,
report.expected)` from `reference/upgrade-reader.mjs` to every entry in
`report.snapshots`; require VERIFIED each time. Snapshot replay is distinct
from source-pin/compiler/runtime checking and from a new chain run.

### Two engineering corrections, without changing protocol rules

1. The old performance comparator correctly refused the required runner edit:
   188/189 initially passed, with its all-support-pins equality the sole
   failure. The narrow migration now permits exactly the old runner hash and
   the reviewed new hash, rejects unknown/missing/extra/changed support pins,
   and keeps every other workflow/input/compiler/semantic/calldata/gas gate.
   Both historical JSON reports are unchanged. The current run is labeled a
   base-profile regression, not a fresh journal-only A/B. See
   [the historical comparison boundary](../2026-09-09-files-parity-performance/comparison.md#september-9-runner-integration).
2. Forge initially refused `vm.getCode` access to its own compiled artifacts.
   A scratch-config diagnosis established the missing `out` read permission.
   The selected followup adds only that read permission to the normal local
   test config, preserving the original type-input permission and every build
   setting. No write or external-directory permission is introduced.

The first correction risks provenance drift if made too broadly; exact literal
pins, adversarial tests and independent review bound it. The second grants
test cheatcodes access only to their own local build artifacts. Neither is an
owner protocol ruling or a reason to rewrite old experimental evidence.

## Next result and retrospective

Build the [small guest Files screen](../2026-09-09-v1-parity-overnight/consumer-build-card.md)
through the shared Reader/Files result, then connect profile-checked actions.
Its real RPC path must be measured separately from offline retained-snapshot
replay. The full independent oracle is a test comparator, not the per-row SDK
hot path. The Data Explorer PM's read-only review narrowed the first screen
to understandable outcomes and reachable evidence, without a desktop shell.

What worked: a single shared Store/read algorithm exposed upgrade-context
mistakes without adding another authoritative model or changing accepted data.
What could be better: the initial task plan did not account for the comparator's
frozen runner pin or the existing test-artifact permission. Both now have
explicit bounded repairs, rather than hidden exceptions or recurring setup
workarounds. Next time, check those integration assumptions before dispatch.
