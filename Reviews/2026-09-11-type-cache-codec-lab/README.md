# Standalone lossless Type-cache codec checkpoint

Status: **PASS_CODEC_ONLY — not Core integration or a new protocol format.**

This disposable experiment tests whether ABI padding can be removed from the physical compiled Type cache while retaining its exact logical ABI. It changes no existing Core, helper, reader, browser, or admission test. The actual 64-field declaration support falsifier remains RED in [the browser boundary test](../2026-09-09-files-browser-mvp/test/type-cache-boundary.test.mjs): this codec is not on that execution path.

## Result

An independent JS byte encoder and the new Solidity codec agreed on 19 Types compiled by the unchanged `PreparationHelper`, independently checked against canonical schema bytes and IDs. Two additional inputs stress full integer widths and the full representation envelope; these are explicitly **codec-valid synthetic inputs, not parser-valid Types**. Logical ABI, original descriptor/name bytes, ordering, full Type IDs, hashes, signed int256 bounds, and all other cached values round-trip exactly.

| Case | Logical ABI bytes | Compact payload bytes | Including a hypothetical STOP prefix |
| --- | ---: | ---: | ---: |
| One BOOL field | 704 | 121 | 122 |
| 64 BOOL fields with 64-byte names | 24,960 | 5,536 | 5,537 |
| Synthetic full representation envelope | 33,152 | 12,110 | 12,111 |

The STOP-prefix column is arithmetic, not a deployed code-cache measurement. Only the codec and original helper were deployed in this lab.

The actual corpus includes retained application Types plus small/boundary fixtures and ARRAY, MAP, STRUCT, OPTION, REF, indexes, and signed constraints. Fourteen malformed physical inputs reject in both `unpack` and `readHeader`; five malformed logical ABI inputs reject in `pack`. Coverage includes unknown format, reserved bits, count limits, crossed/inconsistent section lengths, truncation, trailing data, descriptor envelope overflow, and zero/65-field caches. This is a bounded differential checkpoint, not exhaustive fuzzing or a security audit.

## Measured local receipts

solc `0.8.30+commit.73712a01`, optimizer 200, viaIR, Cancun. Local managed Anvil, chain 31337, transaction gas limit 16,777,216, ordinary runtime/initcode size checks. Concurrent unrelated work means there is **no wall-clock performance claim**.

Codec runtime: **7,700 bytes**; initcode: 7,726 bytes; deployment gas: **1,718,528**. Original helper runtime: 18,953 bytes; deployment gas: 4,152,019.

| Sample | `pack` gas | `unpack` gas | `readHeader` gas |
| --- | ---: | ---: | ---: |
| Small | 43,385 | 32,724 | 26,916 |
| 64-field boundary | 756,051 | 366,714 | 129,113 |

These are successful **transaction receipt** gas values, including intrinsic and calldata gas, not internal-call costs, L2 prices, complete Type admission, or whole-browser economics. The header function walks at most 64 field frames and receives the entire packed blob; it does not parse or allocate descriptor bodies, but it is not an O(1) authenticated code-pointer header reader.

The first and final successful runs produced the same runtime and method receipt gas. Their block hashes differ. [Final evidence](evidence/candidate-run2.json) retains compiler/source/input pins, classification and hashes for every cache, runtime hashes, transaction/block hashes, gas receipts, execution profile, and successful managed cleanup. [First successful run](evidence/candidate-run1.json) predates the extra envelope case and input-source pins.

## Provisional physical layout

`src/CompactCacheCodec.sol` exposes only `pack(bytes)`, `unpack(bytes)`, and `readHeader(bytes)`. Its `EC01` tag is a lab-local format label, not an adopted EFS version.

- 96-byte header: tag; four counts; uint32 maximum body size; uint16 field-section length; zero reserved bytes; exact Type ID and schema blob hash.
- Each field: 18 bytes of existing scalar metadata and descriptor length, followed by **unchanged descriptor bytes**.
- Roles: 34 bytes; indexes: 2 bytes; constraints: 66 bytes with full signed 256-bit bounds.

The loose current-parser envelope is `96 + 64*18 + 8190 + 16*34 + 8*2 + 32*66 = 12110`. Top-level field descriptors are disjoint retained slices of the bounded canonical input; nesting is already inside its parent slice. The synthetic envelope deliberately combines maxima that a real canonical schema need not attain. It demonstrates codec capacity, not a largest legal Type or universal future bound.

`pack` requires canonical logical ABI; physical framing is exact and trailing/reserved/unknown-format data refuses. The codec deliberately does **not** interpret kind/class/index tags as valid application semantics: unknown semantic tag bytes survive synthetic round trips. Only canonical parsing and actual admission can establish Type validity and authority.

## Reproduce

From the existing prototype worktree, with its installed rehearsal dependencies and Foundry toolchain:

```sh
node --test Reviews/2026-09-11-type-cache-codec-lab/test/codec.test.mjs
codec_build=$(mktemp -d /tmp/efs-cache-codec-lab.XXXXXX)
EFS_CACHE_CODEC_CHAIN=1 EFS_CACHE_CODEC_BUILD="$codec_build" EFS_CACHE_CODEC_REPORT=local-new-run.json node --test Reviews/2026-09-11-type-cache-codec-lab/test/codec.test.mjs
```

The default test is pure and skips the chain. Explicit chain mode compiles into the required isolated build root, deploys only this codec and the original helper, and uses the existing managed Anvil lifecycle. Reports are create-only: choose a new filename on rerun. There is no public RPC or tracing mode. The final run stopped PID 62903 and removed its isolated Anvil cache; the isolated build artifacts were retained for review.

TDD history: the pure byte test was written first; [the deployed reverting-stub run](evidence/red-stub-actual.json) then failed at the first desired Solidity pack call with `CodecNotImplemented()` (`0xeb3b721a`). That is the implementation RED. The earlier [import-path setup failure](evidence/red-stub.json) is retained but is **not** counted as RED. Only then was the codec implemented, followed by both successful runs above. No safety checks or existing failure expectations were relaxed.

## Next gate, not a claim earned here

1. Review this codec before integration. A separate module is necessary: the existing admission library has only 11 bytes of runtime headroom. Do not inline this implementation or trim assertions to fit.
2. After cache-module extraction, try raw small caches plus compact large caches in a fresh disposable world. Bind every execution component to the authenticated profile and preserve exact logical rows, Type IDs, journal semantics, and bounded return data.
3. Turn the existing declaration support falsifier green under the unchanged transaction limit; measure complete receipts, small-Type controls, read parity, valid/invalid records, and late-failure rollback including helper CREATE nonce. Microbenchmarks cannot establish those properties.
4. Keep format dispatch, code-pointer integrity, query-header reads, portable replay, and independent-reader changes explicit. This does not solve the earlier populated storage-bytes-to-code-pointer migration.

No production layout, authority, Type language restriction, schema version, cache deployment interface, or economic promise was adopted. The practical finding is narrower: a lossless standalone representation fits this parser's cache envelope well below one code-contract ceiling, so reducing Type expressiveness is not yet justified by the raw ABI cache limit.
