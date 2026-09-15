# Guarded archive review fix 1 — required zero Record references

Reviewed base: `e397df90e35be86b44d390c9d62cb15d9abe9053`. This is a JS-only correction to the exported typed-byte/reference closure guarantee. All prior Solidity, chain, byte-size, receipt and gas measurements in the parent evidence directory remain pinned to that base; none were rerun or relabeled for this fix.

The Ledger requires a Record for every declared reference slot. A zero expected Type is a wildcard for Type equality, not permission to omit a zero-valued Record ID. The offline verifier now rejects an omitted declared zero reference with the existing `ARCHIVE_REFERENCE_MISSING` error. An explicit missing-Record entry remains `PARTIAL`, with `record:0x0000000000000000000000000000000000000000000000000000000000000000` in `missingMeaning`; `AUTHOR_SIGNATURE_VERIFIED` and `sourceAdmission: NOT_PROVEN` remain separate. The source exporter traverses this edge and emits its existing `RECORD_UNAVAILABLE` placeholder when absent.

One focused regression constructs a real signature over internally consistent action, Type, body, ReadSet and execution hashes. It reproduces the never-admitted signed-claim defect without relying on a preceding tamper failure. The fixture has one declared wildcard reference and a zero reference word.

## Focused verification

From the lab directory, with `EFS_ETHERS_PATH` set to the existing ethers installation:

```sh
node --test --test-name-pattern='zero-valued declared Record reference' browser/guarded-archive.test.mjs
# RED exit 1: tests 1, pass 0, fail 1; Missing expected rejection.
node --test browser/guarded-archive.test.mjs
# GREEN exit 0: tests 4, pass 4, fail 0.
```

Exact outputs: [RED](red.log), [GREEN](green.log). No Solidity compilation, chain process, gas run, browser or UI action occurred. The exporter correction was checked directly against its existing missing-Record traversal; this fix adds no separate exporter/chain test.

## SHA-256 pins

| Path (relative to lab) | SHA-256 |
| --- | --- |
| `browser/guarded-archive.mjs` | `7f1b23aa619fc033e11134c27b60da561f6ce3f7cbfa52c16404eb47c999567a` |
| `browser/guarded-archive.test.mjs` | `81b01f772f9b504014a19b5617349615f5cbbe250c0233b35c4c7948c79dc97b` |
| `guarded-archive-20260914/fix1/red.log` | `af8fae4c8a9cfd8f4c5351bcf80ed9215c170445d6b6d7dcdb08987ef001899d` |
| `guarded-archive-20260914/fix1/green.log` | `e3c93e4930d0e8d8b9e1960b59f7510810ac9db581524947f555118c8955a34d` |
