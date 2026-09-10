# Data readiness and Fable prototype reconciliation

**Status:** source review and fresh bounded local verification; implementation gaps remain
**Date:** 2026-09-10
**Author:** @v2-pm, harness Codex, session data-readiness-20260910

## Outcome

The working Files browser is credible integration progress. The data-model
readiness gap is now narrower and more explicit: mandatory programmable
acceptance, generic developer tooling, authenticated export, real-wallet
submission/funding and scalable canonical reads need closing work. This is not
a finding that EFS requires a different complete data model or must adopt MUD.

Design updates: [[Designs/efsv2/programmable-type-acceptance]] and
[[Designs/efsv2/data-model-readiness]], integrated into the constitution, Core
candidate, layered Type proposal and existing E8 evidence gate. No mechanism
was owner-promoted, no runtime source changed, and no product deployment occurred.

## Exact source and method

- Owned PM worktree: `codex/mvp-c0-coherence`, base
  `cce0c730bcb26e5e6e083b99ad10302141166b54`; its prior research/status edits
  were preserved and included in this authorized design session.
- Fable source: `fable/2026-09-09-files-browser` at
  `92f2d6bd7d021f2dc5488482fe29f68bbef41d38`, clean at inspection.
- Fable's newly pasted report was treated as review evidence, not authority.
  The older in-tree `report-for-codex.md` is not the newer checkpoint inventory.
- Three independent read-only reviewers checked authorization/source claims,
  programmable acceptance, and capability/simplicity coverage. The latter two
  reread the new drafts; caller authentication, action-use scope and payable
  duplicate/refund accounting were added in response.
- Peer research remains [[2026-09-09-mud-and-validation-research]] with pinned
  primary sources. This pass did not rerun every peer implementation or claim
  performance parity with them.

## Fresh executable evidence

Commands run from the Fable worktree, using existing installed dependencies:

```sh
node --test --test-concurrency=1 Reviews/2026-09-09-files-browser-mvp/test/static-hosting.browser.mjs Reviews/2026-09-09-files-browser-mvp/test/journeys.browser.mjs Reviews/2026-09-09-files-browser-mvp/test/completeness.browser.mjs Reviews/2026-09-09-files-browser-mvp/test/completeness-regressions.test.mjs
```

Result: **4 test groups passed, 0 failed**, 25.32 seconds. They exercised the
existing real local contract-backed browser lifecycle, standalone static
hosting/direct RPC, partial-export hiding and reader completeness regressions.
This is headless Chromium on local Anvil, not WAN or a real-wallet session.

The independent authority reviewer also ran:

```sh
node --test Reviews/2026-09-09-files-browser-mvp/test/authority.test.mjs Reviews/2026-09-09-files-browser-mvp/test/router.test.mjs
```

Result: **2 test groups passed, 0 failed**, 5.37 seconds. Reported authority
directory admission was 5,127,276 gas; 10 KiB/three-chunk file admission was
8,615,221 gas. These are narrow local workload measurements, not total upload
cost, network latency or comparative MUD benchmarks.

Parent rerun of the same authority/router command: **2 passed, 0 failed**,
5.14 seconds; directory 5,127,264 gas and three-chunk file admission 8,615,209
gas. Both observations are retained rather than presenting one run's exact gas
as an invariant.

## Findings that change readiness claims

| Finding at `92f2d6b` | Required treatment |
| --- | --- |
| Core verifies author intent and router address/runtime hash; existing tests refuse replay, impersonation and stripped-router use. | Preserve this improvement. It establishes routed-consent protection for this path, not universal absence of privileged alternatives. |
| `claimPrincipal` is first-come binding of an arbitrary unclaimed ID; fixture authors are preclaimed. | Do not adopt it as production account derivation, migration or identity recovery. Add ownership/derivation and first-claim front-running tests. |
| U3 retains trusted operator `executeFixture` authority. | Correct “every write is an AuthorIntent” to the supported user path; inventory bootstrap, migration, operator and upgrade authority before production. This is an acknowledged fixture trust boundary, not an untrusted-user exploit. |
| Browser local author key signs typed intent, admission transaction and each chunk transaction. | One simulated UI approval is not one real wallet request. Real sponsor/session or explicitly weaker direct-transaction handling is engineering work, not merely a manual click-count test. |
| `byteCommitment` is signed but not compared to the actual publication tree. Signed publication already commits the actual tree. | Either enforce consistency or remove/label the redundant field. Do not claim it separately constrains content when it is audit metadata. |
| `stageChunk` accepts any self-consistent caller-supplied tree, even without prior admission. | Separate content integrity, author admission and staging economics. “Committed” here is not necessarily “previously author-approved.” |
| Static export contains labeled disposable keys and targets the local chain. | Standalone SPA architecture is demonstrated; public deployment-ready wallet/key configuration is not. Never publish a build containing real signer keys. |
| Offline verifier does not compare its computed hash/tree to an authenticated expected commitment; it checks revision ID length and nonempty evidence. | **Authenticated offline recovery is not proven.** Fix the exporter/verifier proof chain and negative fixtures before preserving the clean-verification claim. |

Source locations (relative to the Fable checkpoint):

- `Reviews/2026-09-09-files-browser-mvp/contracts/src/AuthorityUpgrade.sol`:
  principal claim, `executeAuthorized`, signed audit field, permissionless staging.
- `Reviews/2026-09-08-upgradeable-foundation/src/UpgradeableFixtureCore.sol`:
  inherited operator-authorized fixture path.
- `Reviews/2026-09-09-files-browser-mvp/web/app.mjs`: `submitRaw`,
  `runOperation` and `exportFolder`.
- `Reviews/2026-09-09-files-browser-mvp/scripts/environment.mjs` and
  `export-static.mjs`: disposable keys and standalone configuration.
- `Reviews/2026-09-09-files-browser-mvp/scripts/verify-export.mjs`: lines
  26–36 compute an unrelated single-leaf tree, test ID length, report a hash
  check unconditionally and accept any nonempty evidence array.

The authority reviewer additionally ran local inline probes: an arbitrary
first-come Principal claim and trusted-operator write succeeded; a correctly
signed unrelated byte commitment was accepted; an unadmitted self-consistent
tree could be staged; a valid intent naming the wrong router codehash failed
with `ErrExecutorBinding`. These are reviewer-reported probes, not saved new
regression tests. The two existing suites above are the reproducible test files.

## Reproduced offline-verifier counterexample

The parent independently reran the capability reviewer's synthetic-input probe.
It changes no file or verifier logic: the read hook supplies a fabricated JSON
input to the existing script. Run from the EFS workspace root:

```sh
node --input-type=module <<'JS'
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const fake = {
  kind: 'EFS_FILES_EXPORT_V0', pathLabel: '/synthetic', coverage: 'COMPLETE',
  basis: { blockNumber: 1, chainId: 31337,
    blockHash: '0x' + '0'.repeat(64), executionSetId: '0x' + '0'.repeat(64) },
  rows: [{ kind: 'FILE', name: 'fabricated.bin', nodeId: 'fake' }],
  files: { fake: { integrity: 'VERIFIED', bytes: '0xdeadbeef',
    revisionId: '0x' + '0'.repeat(64) } },
  evidence: [{}]
};
const originalRead = fs.readFileSync;
fs.readFileSync = function(path, ...args) {
  return path === '__synthetic_export__'
    ? JSON.stringify(fake) : originalRead.call(this, path, ...args);
};
syncBuiltinESMExports();
process.argv[2] = '__synthetic_export__';
await import('./planning-fable-files-browser/Reviews/2026-09-09-files-browser-mvp/scripts/verify-export.mjs');
JS
```

Observed exit **0** with:

```text
3 checks passed, 0 failed, 0 explicitly partial.
Clean offline verification: no RPC, no cache, no index.
```

Those bytes, zeroed IDs/basis and dummy evidence do not establish a valid EFS
export. This is counterevidence to the current offline verification claim,
not to the separate live chunk verification path. A real repair must compare
retained expected commitments, support actual chunk geometry, reconstruct the
selected-record chain and qualify the external trust basis. Hashing arbitrary
input without comparing it cannot establish integrity.

## Next bounded work

1. Enforce one immutable custom rule and one stateful paid/unique rule through
   a single guarded coordinator. Test direct hook spoofing, alternate admission,
   raw-Binding-as-equip, duplicate-with-value and complete rollback.
2. Generate the Type helpers and exercise an independent Solidity consumer,
   an old editor/new Type and a generic Inspector. Reuse the existing five SDK
   seams and Files browser, not a second application data implementation.
3. Repair authenticated export and the real approval/funding path in separately
   reviewable prototype increments; retain the passing local journeys.
4. Compare contract-side directory page aggregation on the same churn workload,
   with explicit current/history coverage and independent canonical reads.

The new acceptance architecture has been reviewed in prose, not implemented or
executably validated. No broad “feature complete,” “production authorization,”
“one real-wallet popup,” or “complete offline recovery” claim follows from this
pass. The useful outcome is a smaller, testable set of implementation tasks and
corrected design boundaries.
