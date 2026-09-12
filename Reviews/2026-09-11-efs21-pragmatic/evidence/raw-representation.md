# Explicit raw payload representation

**Standing:** measured disposable native-profile experiment, not adopted EFS v2, a production Type, full-C0 parity, a live-world migration, or a code-as-data storage backend.

The 41-byte fresh edit falls from **311,203 to 264,011 receipt gas** in the matched common build. Removing inner ABI framing saves 47,192 gas here, but **still misses the provisional 250k ambition**. New-file creation is 645,501 → 598,309 gas. Retained history, explicit presence, mandatory navigation and the no-profile discovery hook remain present.

## Exact experiment and provenance

- Implementation source: `1254c22861fc9a4213c8f54795751ed41eb15720`, branch `codex/efs21-pragmatic`; parent checkpoint `e605fc9fb173d195960e41247ca270c074d5060c`.
- Measured at `2026-09-12T01:25:53.125Z` (September 11 Chicago evening). [Complete separate receipt evidence](raw-representation.json) retains 75 receipts per world: 11 setup, 1 namespace setup, 60 matched actions, 3 unpaired capacity actions.
- Canonical then raw: fresh sequential owned Anvil worlds, same source/support pins, compiled creation bytecode and all deployed runtime hashes, same fixed disposable signer/deployment order, Cancun, Solidity `0.8.30+commit.73712a01`, optimizer 200, via-IR, ordinary 24,576-byte runtime and 16,777,216-gas ceilings. Both worlds register all three Types and use the expanded registry. Neither attaches a discovery profile.
- Kernel creation hash: `0x215a49c57d2b8438b79e512fb299b889ae5ebf6db3e36017517390ffa15b9808`; runtime hash: `0x7bd050f45ac6b0ac667854b652228606a024caf9fcb821f81138bc4a25bc9c04` (9,549 bytes).
- Every production source hash, support-file hash, compiler setting, dependency lock hash, actual deployed runtime hash/address and cleanup result is retained in each world's `provenance`. Inputs retain exact calldata or its setup hash, byte count and zero/nonzero composition. Receipts retain transaction/block identity, status and gas. Read estimates are separate and block-qualified.
- Previous benchmark/history/discovery/full-C0 JSON evidence is unchanged. Common expanded-registry setup is **not** attributed to a representation saving; do not compare this arm to an older build and call the difference raw-only.

## Representation and identity

`RawBytesValidator.sol` accepts every byte sequence, including empty, without promising UTF-8 or a schema. `ExpandedTypeRegistry.sol` permits exactly the original uint/canonical runtimes plus this one new stateless runtime. The kernel's external `types()` seam remains typed as `ExactTypeRegistry`; `DiscoveryIndex.sol` and scalar semantics are unchanged. No arbitrary validator programs were admitted.

The original `ExactTypeRegistry.sol` is byte-for-byte unchanged; its source hash remains `0x99a671a7d764463b5f2cffc253da9495c416a3b77b030a1692271297a29732f2`. Actual runtime hashes were compared against retained `benchmark-2.json`, not merely executable logic:

| Validator | Runtime hash | Exact TypeId |
|---|---|---|
| Original canonical bytes | `0x7e92cad2ce2be829e73e2afe41da53267112bbc5fd34696e89e7e1f597b98854` | `0x94a7eaa53d34306217a8fbe7dc8a052d5c0584d6429b5423cf52d6294a4dda44` |
| Original uint256 | `0x806fcf24a458981880f40a2a4a26427d1abc538a2f1eb307c02a661273ed0dae` | `0x6856b9ce6276f5dacfe0e1cac0b8b9c62bedd3c9e1b4393046136bf456021afa` |
| New raw bytes | `0xf4101c3a9c7bb96c4a8f58f0508a51c3941a16ed0f32666e198a9e9868ecc4a5` | `0x40f17154a13dfce2997b3d7d514812bb02dec16f8a545c450754b76c0e354957` |

The raw descriptor is exactly `EFS21 exact raw bytes v1`. `EFS21_TYPE_V1`, `EFS21_RECORD_V1`, and ordinary ABI identity formulas remain unchanged. New raw Types/Records are distinct; no old record is reinterpreted. Explicit `hasRecord` remains necessary: empty raw bytes are a present immutable record, not absence. Validation precedes deduplication.

SDK `body()` remains canonical for prior callers. `representation`, `payloadLimit`, `encodePayload` and `decodePayload` select by exact known TypeId. Canonical decode validates framing through canonical re-encoding; unknown Types expose verified exact bodies through `record()` but receive no guessed payload/text codec.

The browser exposes a creation representation selector. Revision editing defaults to keeping the observed Type; explicit conversion creates a new revision and preserves the opened payload, including binary. History interprets each record by its own Type. UTF-8 is a strict viewer choice; unknown Types never enter the text editor and download the exact body. Existing navigation and unresolved-submission write holds remain in force.

## Actual matched receipts

The namespace/root exists first. A distinct 41-byte standalone record initializes the exact-Type inventory before first file creation; the first regular file initializes that namespace's non-root file counter/list. The edit changes 41 `0x41` bytes to 41 `0x42` bytes; the same-content edit still adds a revision. Each transaction begins with cold EVM access sets, not warm state shared across transactions.

| Workload | Canonical gas | Raw gas | Saved gas |
|---|---:|---:|---:|
| Standalone unique 41-byte record | 244,023 | 196,831 | 47,192 |
| Duplicate standalone admission | 40,475 | 37,687 | 2,788 |
| First regular file, fresh 41-byte record | 645,501 | 598,309 | 47,192 |
| Second file, deduplicated record | 429,199 | 426,410 | 2,789 |
| Fresh-content edit | 311,203 | 264,011 | 47,192 |
| Same-content edit, new revision | 124,461 | 121,672 | 2,789 |
| Unrelated payload consumer capture transaction | 158,325 | 153,410 | 4,915 |
| Rename | 216,457 | 216,457 | 0 |
| Unlink | 115,669 | 115,669 | 0 |
| uint256 producer first publish | 600,423 | 600,423 | 0 |
| uint256 producer update | 245,563 | 245,563 | 0 |
| uint256 consumer transaction | 77,365 | 77,365 | 0 |

`PayloadConsumer` resolves the public path, selects one of two pinned Type codecs, and captures payload digest/length/revision/RecordId. Independent receipt-block reads verified all four stored effects. The view estimate is not that receipt: **70,008 → 65,093 estimated gas**. Current 41-byte `readRecord` estimates are **38,271 → 33,865**, with 256 → 192 returned ABI bytes. Revision metadata reading is unchanged at 34,418 estimated gas; historical body bytes remain readable after rename/unlink.

### Setup is separate

Both worlds incur the same setup receipts. The kernel receipt includes the internally created navigation, discovery and expanded registry, not invented separate deployment receipts.

| Setup | Receipt gas |
|---|---:|
| Kernel + internal indexes/registry | 5,082,046 |
| Canonical validator deployment / Type registration | 136,989 / 115,836 |
| uint256 validator deployment / Type registration | 91,483 / 115,450 |
| Raw validator deployment / Type registration | 90,835 / 116,065 |
| Quote producer / quote reader / plain mapping | 897,652 / 328,202 / 123,387 |
| Payload consumer | 428,262 |
| All 11 setup receipts | 7,526,207 |
| Separate caller namespace setup | 229,723 |

### Byte-pattern and storage-word boundaries

Every length below was measured for all-zero, repeated nonzero `0xef`, and mixed `i % 256` bytes, with a second duplicate admission. The table shows first-admission **nonzero** receipts; the sole empty unique admission is shown for length zero. Empty nonzero/mixed cases and one-byte mixed `0x00` intentionally deduplicate earlier cases: the JSON marks `expectedDedup`, so these are not mislabelled fresh records.

| Payload bytes | Canonical body bytes | Raw body bytes | Canonical gas | Raw gas |
|---|---:|---:|---:|---:|
| 0 (unique empty) | 64 | 0 | 159,771 | 114,580 |
| 1 | 96 | 1 | 204,805 | 134,699 |
| 31 | 96 | 31 | 202,495 | 135,059 |
| 32 | 96 | 32 | 202,418 | 157,298 |
| 33 | 128 | 33 | 227,539 | 179,635 |
| 41 | 128 | 41 | 226,923 | 179,731 |
| 256 | 320 | 256 | 361,572 | 316,440 |
| 4032 | 4096 | 4032 | 3,044,629 | 2,999,497 |

Raw 31/32 bytes crosses Solidity's short/long dynamic-byte storage boundary; observed receipts show the discontinuity. This is not a measured slot-count decomposition. All-zero 4032-byte admission is much cheaper (488,845 → 443,713) than nonzero bytes; payload length alone does not determine cost. Outer transaction ABI encoding still exists even when the stored record body is raw.

### Capacity, not paired savings

| Payload bytes | Canonical | Raw |
|---|---|---|
| 4033 | 4128-byte body; rejected, 87,427 gas | admitted, 3,021,840 gas |
| 4096 | 4160-byte body; rejected, 88,299 gas | admitted, 3,044,966 gas |
| 4097 | 4192-byte body; rejected, 88,451 gas | rejected, 88,159 gas |

These are standalone admission receipts, not complete file-create receipts. The benchmark deliberately bypasses the SDK encoder only for the onchain refusal measurements. Normal SDK/browser payload bounds reject canonical >4032 or raw >4096 before signing.

## Verification and falsifiers

- Full native suite: **74 Forge tests** (68 existing + 6 raw), **23 Node tests** under `node --test --test-concurrency=1 test/*.test.mjs` (17 existing, including six offline full-C0 evidence checks, + 6 raw/codec/server tests). Build size checks pass. A later test-only lint comment was followed by the six focused raw tests and size check again.
- Empty raw presence differs from missing ID; duplicates add neither record inventory entries nor `RecordStored` events. Same exact body under distinct Types has distinct identity. Binary `0xef`, embedded/trailing zeros, invalid UTF-8 and ABI-looking raw bytes round-trip exactly.
- Missing/changed validators reject duplicate admission. Expanded registry rejects hostile/unreviewed runtimes, scalar discovery rejects raw Types, and bounded STATICCALL rejects false/revert/noncanonical bool/short/oversized/OOG/state-writing responses. Original malformed canonical offsets, lengths and padding still reject.
- Same-content edits increment CAS history; explicit cross-Type edits retain both old records. Duplicate-name creation and late mandatory discovery-hook failure roll back record/body/presence/inventories/file nonce/history. Prior required/tolerated discovery failure tests still pass.
- Real Chromium creates, opens, edits, reloads, reads history and downloads both representations, including binary/empty payloads; explicit raw→canonical conversion preserves payload. Unknown Types expose exact body downloads without guessed text. Prior stale-navigation and unknown-submission/reconciliation regressions pass.
- Test host snapshots its closed assets and serialized config **before listening**. A private loader-buffer fixture proves later source/config mutation cannot change responses; missing assets abort startup. Exact loopback Host, GET-only allowlist and no-store remain. This is a local test-host safeguard, not a backend cache or static-SPA architecture change.
- Both final measurement nodes exited with code 0 and their exact managed caches were removed. No persistent world was launched. No real wallets, funds, production deployments, external network transactions, full traces or other-repo edits.

## Reproduction and remaining limits

`node --test --test-concurrency=1 test/*.test.mjs` reruns finite checks without replacing retained evidence. `node scripts/raw-benchmark.mjs` runs two finite worlds but uses exclusive-create output: it refuses to overwrite this JSON. For a new checkpoint, deliberately choose a separate evidence path before running; do not replace historical receipts.

The benchmark's `COMMITTED_RECORD` annotation is local evidence after independent record read-back, not a new persisted SDK journal status. Consumer transactions retain their SDK receipt status and carry separate `independentEffect` assertions. Trusted RPC state is not a cryptographic proof. There is no bytecode storage backend, state-slot trace attribution, mainnet/rollup fee claim, or full-v2 semantic equivalence. The raw representation saves inner framing/validation/storage work, but large nonzero inline bodies still cost millions of gas and the fresh 41-byte edit remains above the 250k ambition.
