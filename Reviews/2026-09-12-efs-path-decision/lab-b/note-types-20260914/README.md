# Exact-Type Note evolution — bounded local evidence

Task6B, 2026-09-14. Disposable experiment above unchanged Core, Registry and
Files profiles, starting from `3ffa279edbb47f04741be6bec69d300dece97c2d`.
Source SHA-256 pins, computed Type/rule identities, raw qualified results,
receipt rows and selected signed transactions: [evidence.json](evidence.json).
No UI, public deployment, protocol adoption, family registry or generic View ABI.

## What was proved

Three **actual distinct computed Types**, not version labels inside one File Type,
were registered and published through ordinary `Ledger.publish(type,body)` calls.
The exact identity is the existing `Keys.typeId(shape, [], ruleCodeHash)`; all three
mandatory rules are stateless and have zero Record references.

Canonical layouts in [NoteProfile.sol](../test/NoteProfile.sol), with no trailing
bytes, ABI padding or alternative encodings:

| Profile | Packed bytes | Maximum body |
|---|---|---:|
| v1 | `NTV1 / u16be textLength / text` | 1,030 |
| v1.1 | `NT11 / u16be textLength / text / titlePresent:u8 / [titleLength:u8 / title]` | 1,096 |
| v2 | `NTV2 / kind:u8 / u16be textLength / text` | 1,031 |

Text is 1–1,024 printable ASCII bytes or LF; title, when present, is 1–64
printable ASCII bytes. `titlePresent` is exactly 0 or 1. v2 kind is 1 (plain) or
2 (emphasized). These are this **experimental profile's chosen domains**, not EFS
limits or a production multilingual Notes design. All three maxima were admitted.

The unchanged old text-view function can consume `{text}` from explicitly supported
v1/v1.1 projections. A **v1-only exact-Type allowlist still refuses v1.1**; a claimed
compatible label does not update it. v1.1's title stays in original bytes and is
reported as `omittedFields:['title']` from the intentionally text-only view. v2 is
unsupported unless `lab/note-v2-to-text/1` is selected; emphasis additionally needs
`allowLoss:true` and returns `loss:'LOSSY', losses:['emphasis']`. No silent flattening.

## Read boundary

[createNoteReader](../browser/note-reader.mjs) wraps
`sdk.readTypedRecord({record,context})`. The shared seam checks context ownership,
canonical block, body-derived Record, descriptor-derived Type, rule runtime,
historical admission/acceptance and publication provenance. It returns immutable
`{basis,knowledge,coverage,value}`; raw application validity remains `NOT_ASSESSED`.
The Note result keeps this entire envelope as `source`, adding a separate `{text}`
projection and its identity/loss qualification. It does not select HEAD, expand
the Files reader's finite profiles or prove reference closure/current maintenance.

`NotePointReader.read(record,v2Adapter,allowLoss)` returns original bytes/identity,
first admission, retained author/principal, policy activation, basis and projection.
`consume(...)` pays for that read and emits its hashes. **This contract consumer is
direct-Ledger-only and rejects proxy shells.** Existing guarded Files/native-consumer
upgrade evidence is separate; Notes-through-upgrade was not demonstrated. The SDK's
existing guarded `readContext`/`revisionEvidence` execution-context seam is the route
for future explicitly reviewed upgrade support, not a shell-codehash shortcut.

## Decisive controls and costs

The [real fixture](../browser/note-types.integration.test.mjs) checks missing text,
wrong Type/body, truncation, trailing bytes, wrong text domain/title flag, empty
title, unrecognized rich kind, oversize and unregistered Type: real reverted
transactions with unchanged Ledger counts and no admitted Record. A forged v1.1
shape with the v1 rule registers as another exact Type, admits only that rule's
layout, and is unsupported by the Note reader; wrong descriptor/rule reader pins
revert. RPC body/descriptor/code/admission tampering yields INVALID/PARTIAL;
unavailability yields UNKNOWN/PARTIAL. Pure projection controls also preserve
CONFLICT/INVALID/ABSENT/PARTIAL rather than producing an empty valid Note.

All numbers below are single local receipts, **raw typed-Record recipes, not whole
named Files operations**. v1 is the first publication into an empty Ledger/index;
later rows share initialized counters/lists, so these are not matched version-cost
comparisons. Setup/registration costs are excluded from operation rows.

| Operation | Body / calldata bytes | Gas |
|---|---:|---:|
| Publish v1 `hello` | 11 / 132 | 817,998 |
| Publish v1.1 `hello`, title `T` | 14 / 132 | 531,142 |
| Publish v2 plain `hello` | 12 / 132 | 530,416 |
| Publish v1 maximum | 1,030 / 1,156 | 1,447,309 |
| Publish v1.1 maximum | 1,096 / 1,220 | 1,523,694 |
| Publish v2 maximum | 1,031 / 1,156 | 1,447,410 |
| Paid read v1 / v1.1 | — / 100 | 122,495 / 123,396 |
| Paid read v2 plain / emphasis-lossy | — / 100 | 122,766 / 122,800 |
| Paid read v1 maximum | — / 100 | 414,604 |

Each SDK v1/v1.1 Note point read after `pin()` made 18 RPC calls: 4,364 request
bytes and 10,152/10,852 response bytes in the retained run. Pin cost is excluded;
the reader sends no transaction and spends no EVM transaction gas.

| Deployment | Runtime / initcode bytes | Gas |
|---|---:|---:|
| v1 rule | 965 / 991 | 261,839 |
| v1.1 rule | 1,315 / 1,341 | 337,469 |
| v2 rule | 939 / 965 | 256,205 |
| NotePointReader | 5,867 / 7,791 | 1,532,585 |

### Actual rule-budget limit

The initial per-byte copy loop caused the 1,024-byte text's standalone rule-call
estimate to be **524,085 gas including intrinsic gas**; real publication reverted
(621,699 gas receipt) under the Ledger's unchanged **300,000-gas mandatory staticcall**.
One bounded Cancun `MCOPY` replaced that duplicate copy loop; final standalone
estimate is **258,944 gas including intrinsic**, and real maximum publication now
succeeds. This is **Cancun/MCOPY execution-profile-dependent**, not a general EFS
size/performance guarantee. [Control](red-budget-control.json) retains the failed
signed publication/rule deployments and source hashes; [inverse patch](red-copy-loop.patch)
reconstructs the exact earlier source (also removes the later proxy guard).

## Verification and reproduction

Runtime: Node 26.0.0; Forge/Anvil 1.7.1, commit `4072e487`; cached Solc 0.8.30;
optimizer 200, via-IR, Cancun. No install/fork/unlimited-size/tracing flags. Each
fixture chooses a fresh loopback port/cache, bounds history to 256 states / 512
transaction blocks and closes its Anvil. Signed transaction gasLimit is 15,000,000
(checked ≤16,777,216); runtime/initcode checks are 24,576/49,152 bytes.

From `lab-b`, with `EFS_ETHERS_PATH` and `ANVIL_BIN` set to existing installations:

```sh
note_scratch=$(mktemp -d /tmp/efs-note-types.XXXXXX)
export FOUNDRY_OUT="$note_scratch/out"
forge build test/NoteProfile.sol test/FilesApplication.sol test/FilesLiveIndex.sol test/FilesNamesProfile.sol test/FilesJoinedConsumer.sol test/UpgradeProxy.sol test/GuardedDelegate.sol --out "$FOUNDRY_OUT" --cache-path "$note_scratch/cache" --offline
node --test browser/note-types.integration.test.mjs browser/note-reader.test.mjs browser/compact-sdk.test.mjs
```

Final focused run: **40/40 passed**. The unchanged shared-engine guarded regression
plus Note fixture passed **48/48** before the later Note-only proxy guard; the final
focused run verifies that guard. Initial RED checks caught the absent Note API/raw
point seam/rules; behavioral RED caught the rule-budget failure and incorrectly
accepted proxy shell. Compiler warnings remain: existing Keys shadowing/Files
lint, plus lossless four-byte literal casts in this fixture. No exhaustive suite.

Remaining gates: reviewed support mappings for each future exact Type; policy and
dependency semantics for stateful validators; generic evolution/discovery/migration;
multilingual/richer schemas; upgrade-aware paid Notes consumers; source-state proof;
production packaging. RPC observations and immutable retained bytes do not establish
present endorsement, trust, portability authority, or generic future compatibility.

## Review fix 1 — uncertainty is not invalidity

Starting from `035f9b9`, the raw point reader now maps the known
`COMPACT_HISTORY_UNAVAILABLE` and `COMPACT_BLOCK_REORG` errors to UNKNOWN/PARTIAL
before its generic integrity-error fallback. Original reason and pinned basis
remain attached; raw and projected values are null. Actual body/descriptor/code/
admission mismatches remain INVALID/PARTIAL.

Two focused controls alter only provider observations beneath the real SDK:
a missing publication principal and a different canonical hash after pinning.
Both failed RED with actual INVALID versus expected UNKNOWN; final Note + shared
SDK run passed **42/42**, including unchanged corruption controls. These simulate
missing historical evidence/reorg observations, not actual pruning or a chain
reorganization. No Solidity/artifact changes; earlier costs and evidence remain
historically pinned to `035f9b9` rather than silently rewritten.

Fixed source SHA-256: `browser/compact-sdk.mjs`
`22d4706d79eedafd8a96702a51f9ba74993e7d688119df0ded80efc1875ffdf1`;
`browser/note-types.integration.test.mjs`
`f7be54e44528a41ff2ed593db1e4416d8df1142a4b782d2b81841bca53109f48`.
