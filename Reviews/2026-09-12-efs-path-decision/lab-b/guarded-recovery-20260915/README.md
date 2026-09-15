# Bounded original-author recovery spike — 2026-09-15

**Result:** 9 cold signed claims reconstructed usable Files state on a different
chain/origin after source shutdown, then an ordinary owner edit and a real native
carrier-aware application adoption succeeded. This is throwaway feasibility
evidence, not an adopted import/migration protocol. Core is unchanged.

Base: `abf0ab1ed151a2f23ca039572eb4fa54a692f7df`. Sole implementation writer:
Codex / Astra XHigh. Four new source/test files:

- [GuardedRecovery.sol](../src/GuardedRecovery.sol)
- [GuardedRecovery.t.sol](../test/GuardedRecovery.t.sol)
- [RecoveryCarrierApplication.sol](../test/RecoveryCarrierApplication.sol)
- [guarded-recovery.integration.test.mjs](../browser/guarded-recovery.integration.test.mjs)

## What was observed

The independent exporter process received only source endpoint, public manifest
and publication inventory. It had no writer journal, body map or name map.
The source process was stopped; a separate offline verifier disabled network
access. Destination retention was permissionless and left Core state unchanged.
A new destination reader re-exported the archived claims, checked their copied
closure and used exact fresh source-author signatures to reconstruct effects.

The slice uses Alice's own signed CREATE + typed Directory root, not the native
bootstrap root. Alice's complete chosen nonce prefix is 0–7, Bob's is 0. It
includes raw-sha256 carrier create/edit, File/revision Concept tags, rename,
Alice masking Bob's placement, reverse-Lens fallback and exact REUSE. Names,
stable File/Directory/record IDs, current and old bytes, binding previous-pointer
history and tag scope were read back. All nine destination publication and first
admission coordinates differ from their source coordinates.

Each copied action vector adds exactly one ordinary typed lineage-statement
PUBLISH. Destination evidence retains exact original action prefixes. The
original EOA authors remain authors; every new Core publication has
`isImported=false`. The native application is author of its own guarded write,
not Alice. The app reads and checks the selected plaintext inline carrier bytes
and their SHA-256 in the same call that publishes its own successor.

Focused checks: **12/12 Forge**, joined source-off integration: **1/1 Node**.
These are the small scope-specific tests, not a full-suite campaign. RED logs
retain the absent recovery behavior, inconsistent linked read-set preimage and
missing native application. The first scaffold RED also exposed a test fixture
with an uncreated binding target; that fixture was corrected before GREEN.

Decisive controls cover wrong EOA, altered action prefix or statement, missing
nonce prefix, changed source realm/origin, same-revision different-target
destination collision, WITHDRAW, legacy and 64-action source rejection,
destination acceptance and required-index rollback, exact direct execution
before helper reconciliation, conflicting same-author interleaving, permitted
other-author interleaving, missing closure as PARTIAL, duplicates before and
after ordinary writes resume, and native wrong-operator/wrong-byte reverts.

## Real receipt costs

Values below quote the pinned worker `runner-report.json.gz` run. Gas is not a
fee estimate. Source operations used normal SDK guards; destination recovery and
its same-actions control used newly authorized empty destination read sets.
Source guards are retained as source evidence, not transplanted or claimed true.

| Receipt group | Gas |
| --- | ---: |
| Nine ordinary source operations | 12,767,173 |
| Archive retention for nine claims and their attached bodies | 9,281,681 |
| Ordinary destination original-actions control | 10,863,658 |
| Actual reconstructed publications, including direct first publication | 14,899,215 |
| Separate exact-first-publication reconciliation | 240,013 |
| Actual reconstruction route total, excluding retention/deployment/retries | 15,139,228 |
| Nine immediate idempotent duplicate calls | 1,017,037 |
| Linked duplicate after ordinary writes resume | 100,244 |
| Archive + rule + helper deployments, excluding Type registration | 3,938,770 |
| Statement Type registration | 131,287 |
| Retention + actual reconstruction + dedicated periphery setup, excluding retries | 28,490,966 |
| Subsequent owner edit | 1,710,017 |
| Native carrier adoption | 1,404,097 |
| Native carrier app deployment | 1,252,483 |

The first ordinary original-actions root cost 836,649; committing the same root
plus statement directly cost 1,183,547 (346,898 additional gas), followed by the
240,013 reconciliation transaction. For the next file-create publication,
ordinary original-actions cost 2,266,211 versus 2,746,265 through recovery
(480,054 additional gas). These are matched semantic-action controls, not a
universal constant. Later rows include accumulated extra-statement state; the
control does not pretend whole publication vectors or guard vectors are equal.
Every individual raw receipt and calldata size is retained in the packet.

Cold joined verification/read transport: 198 RPC calls, 57,300 request bytes,
301,551 response bytes. The copied closure sidecars were 42,162 JSON bytes.
This measures the full chosen read/check journey, not one file-open latency.

**Authorization:** nine fresh destination signatures for nine restored source
claims, plus one normal owner edit signature and one successful native operator
transaction. No whole-migration one-signature or wallet batching claim.

Individual deployed runtime/initcode bytes: unchanged Ledger 24,173 / 24,956;
archive 10,611 / 11,007; statement rule 330 / 356; helper 6,332 / 7,948; native
app 5,421 / 6,650. All real deployments used ordinary runtime/initcode caps,
15M transaction gas limits and a 30M block limit. No cap inflation. The large
Forge test-harness initcode warning is test-only; that harness is not deployed
by the real integration.

## Boundaries, not claims

- A genuine manifest-qualified immutable Core/archive/helper deployment is a
  prerequisite. The helper constructor trusts its supplied Core/archive;
  arbitrary contracts claiming archive proof values are not self-authenticating.
  The runner byte-checks deployed artifacts and retains actual runtime hashes.
- Source signatures are verified, but source admission, source guard truth and
  canonical source history remain NOT_PROVEN. A contiguous signed nonce prefix
  does not prove no later claims or uniqueness among conflicting signed claims.
- Recovery begins at source nonce zero into an unused destination EOA namespace.
  No unrelated same-author destination writes may interleave before recovery
  completes. This is not a selected-project merge into populated author state.
- Every WITHDRAW, native/legacy source claim, and source claim over 63 actions is
  unsupported. REUSE and all original expected-revision/action fields are kept.
- The stateless lineage rule only checks ordinary record shape and is independent
  of deployment addresses. The statement itself is an author assertion. Verified
  correspondence requires the archive, qualified helper association and exact
  destination evidence. A reconciled link was not atomic with the earlier direct
  publication.
- The slice uses current typed Directory/Concept and raw-sha256-aesgcm-v2 Types,
  but only inline unencrypted bytes. Remote carriers, encryption/decryption and
  general native-source migration are untested. The pre-existing inline-only
  FilesApplication is not falsely represented as carrier-aware.
- Exact Type/rule/body bytes are in copied closure sidecars; the destination uses
  independently deployed matching reviewed fixtures. This is not a generic rule
  redeployer or dependency migration framework. The archive alone omits Type
  descriptors, so the portable bundle includes the explicit closure sidecar.
- Evidence is local RPC observation with raw receipts, not authenticated chain
  state proofs. No public deployment, UI changes or owner demo modification.

## Reproduce (from lab-b)

Use the existing Node 26, Forge/Anvil and ethers v6 installations; no install is
implicit. Set `EFS_ETHERS_PATH` to the existing ethers package directory.

```sh
spike_build=$(mktemp -d)
export FOUNDRY_OUT="$spike_build/out"
export FOUNDRY_CACHE_PATH="$spike_build/cache"
forge build test/FilesPageReader.sol test/FilesApplication.sol test/RecoveryCarrierApplication.sol src/GuardedRecovery.sol src/SignedClaimArchive.sol
forge test --match-path test/GuardedRecovery.t.sol -vv
node --test browser/guarded-recovery.integration.test.mjs
```

The test owns ephemeral loopback nodes and closes only its child processes.
Normal bounded Anvil history is used; no full traces or state dumps are kept.
The parent independently reproduced 12/12 and 1/1 on frozen sources; tiny
per-run calldata/signature gas variation is expected. The quoted cost packet
here stays pinned to the worker run instead of mixing the two runs.
