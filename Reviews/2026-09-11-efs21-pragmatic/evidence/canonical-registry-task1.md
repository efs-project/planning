# Canonical-native Task 1: direct structural registry

Disposable fresh-genesis experiment, not adoption or native Files integration. Source/support was frozen clean at `6d1afce9fe2a3b279a5852c32c9ec3db220e0f6a`; executable product source equals reviewed `a5937cf172439a596eb677e541bc230ae92942ad`. The follow-up adds only artifact retention, supplemental fixtures and checks.

## What this establishes

The separately deployed, fixed-codehash PreparationHelper compiles canonical Type groups and validates bodies through the reviewed parser/RecordBody closure. Registry registration retains exact raw groups, ordered Type IDs and checked immutable caches atomically. References/roles/dependencies and declared indexes are explicitly unsupported in this profile. Reserved kernel mutation IDs refuse; PRINCIPAL bytes confer no authority. Generic Record storage, Files producers/consumers, SDK/browser qualification and whole-application economics are Task 2, not covered here.

Original independent golden remains 22 groups/30 body outcomes. An additive golden supplies 16 schemas (5 valid, 11 parser-invalid) and 15 body outcomes: unsupported DIGEST algorithm, depth/count boundaries, malformed constraints and malformed nested references. Actual standalone compileGroup/prepareRecord and registry calls agree with independent parser/body/cache oracles, including exact error payloads. There are 15 registered groups/16 cache Types and 45 body outcomes in total; this is a bounded corpus, not universal grammar coverage.

## Receipts and retained artifacts

[Signed receipt report](canonical-registry-task1.json): 90 transactions (44 success, 46 expected refusal), transaction/block gas limit 16,777,216. JSON 760,533 bytes, keccak `0x62f97a8952955cb36f202039e9ee7e1631fce11444b1f080863ad9efb8439e9a`.

[Code inventory](canonical-registry-task1.json.code.json.gz): exact registry/helper runtimes, registry compiler artifact and actual caches; 217,203 uncompressed/34,166 compressed bytes, keccak `0xea9e25489ce1a5ff682d94556603764817fb95d0e7e513e51efd47c86c030471`.

[Standalone helper artifact](../contracts/test/fixtures/canonical-preparation-helper.json) pins the fixed six-source input and [complete compiler output including all source ASTs](../contracts/test/fixtures/canonical-preparation-output.json.gz). Output is 2,052,833 uncompressed/206,405 compressed bytes; `--check` reproduces it. The input hash remains `0x6faf0684e96823160df6c07445cd3f6042b3636b9af17cc3e6a9b2fd6167238c`; runtime hash remains `0xe541f3d3c794a65f5066bbac12162d7d8d6064fd7075d68259bb32b88f103677`.

The [full-C0 helper reference](../contracts/test/fixtures/canonical-reference-helper.json) is authenticated against its reviewed signed deployment. Its six source contents, compiler settings and exact constructor/runtime executable prefixes match the standalone artifact; source-key/remapping CBOR metadata differs. Tests deploy the exact standalone artifact, never a newly compiled incidental helper or caller-selected interpreter hash.

## Measured direct costs

| Operation | Gas used |
|---|---:|
| Separate helper deployment | 4,169,079 |
| Registry deployment | 1,800,274 |
| Default two-Type registration | 1,081,225 |
| Exact repeat, no new caches | 339,264 |
| Validate quote 3000 | 97,288 |
| Validate empty framed BYTES | 98,090 |
| Paid cache / TypeInfo / raw-group read | 71,061 / 71,221 / 42,577 |
| Validate depth-4 nested body | 105,317 |
| Validate STRUCT with 64 BOOL members | 353,193 |
| Validate ARRAY with 1,024 UINT8 elements | 804,100 |
| Legal single-cache extent refusal | 5,627,330 |
| Legal aggregate helper resource refusal | 15,120,484 |
| Test-only second-CREATE collision refusal | 16,271,377 |

Every setup, registration, validation, read and refusal receipt is retained individually. These are direct registry transactions, not paid contract-consumer calls, complete Files operations, or a matched old-native cost comparison. No gas savings claim is made.

Actual runtime/initcode: helper 19,032/19,058 bytes; registry 8,058/8,300 bytes including its constructor argument. Ordinary 24,576 runtime/49,152 initcode bounds are unchanged. The collision uses the actual pinned helper and a local-only second-address code injection; first-cache code, helper nonce and group/Type writes roll back. The injected fault is removed before normal registration. No trace is used.

## Verification and qualifications

- Independent scoped re-review resolved the supplemental-corpus and complete-output findings: specification PASS, code quality ACCEPTABLE for bounded Task 1. Root reproduced all 7 focused Node tests, including the live supplemental helper path and offline evidence. This does not promote the profile to production or Task 2.
- Observed missing-API and missing-helper-guard REDs preceded implementation. Review wave observed missing complete-output and missing actual supplemental-path REDs before their support fixes.
- Current classified native Forge: 124 passes; shared C0Core: 214 passes. Narrow final CanonicalTypes: 15 passes. Focused Node: 3 passes; final offline evidence: 4 passes. Supplemental actual helper paths are included, not substituted by direct-library tests.
- Exact original native control: 123 Forge/37 Node including Chromium passed; fresh archived control Forge replay also passed 123. A forced current full native attempt exposed 14 historical metadata-sensitive test exclusions (6 failure entries including History setup); they remain unchanged and pass in their historical context.
- The pre-fix current full Node attempt had 19 passes/21 expected old-profile runtime identity failures. Those current SDK/browser paths are not qualified by Task 1. No historical validator allowlist or source-backed profile was loosened.
- Legal large Types remain limited: a 24,960-byte cache exceeds the 24,575 payload extent. The 16-member/7,010-byte aggregate fixture has source-derived cache sum 333,824/full ABI return 336,096; the actual bounded helper call returned an empty resource revert, **not** an observed oversized-return object or HelperOutput selector. No limits or grammar were changed.
- Each checked member read reloads/hashes the whole raw group and walks its member spans. Larger-group small-member cost sensitivity remains unmeasured. Immutable-state integrity checks do not authenticate a malicious RPC.

Offline replay from this lab:

```sh
node --test test/canonical-registry-evidence.test.mjs
```

Fresh source reproduction uses the exact frozen support commit and exclusive output paths; see the task report for commands and the explicit historical/current classification. Final owned Anvil PID 70014 exited 0 and its exact managed cache was removed; all three preserved demos remained intact. No public chain, migration, production funds or Task 2 implementation.
