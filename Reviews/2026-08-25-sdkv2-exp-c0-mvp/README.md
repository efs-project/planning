# SDK v2 `EXP-C0` MVP preservation and clean-room consumption

**Status:** disposable SDK evidence; validates source preservation and one exact
serialized Core-consumer boundary, not protocol conformance or a production SDK

**Semantic source:** C0 seal at planning commit `a68b00a`

**Exact serialized source:** Core packet commit
`b9088d6a24f4d40bcca6ba300523b25cc7c608d2`, with handoff SHA-256
`2e8d191e4dd7c2130378e09f3cbc5b71441906cbaa6c448c30139aafe9ec203d`

## Two bounded checks

`fixture.json` is intentionally human-readable candidate data. `check.mjs`
checks that each result retains the C0 outer envelope, that cursors include all
resume coordinates, and that the canonical-effect axis cannot gain a local
`EFFECT_REJECTED` value.

`core-inputs/` contains byte-for-byte copies of exactly five serialized files
read from the exact Core commit: the handoff, consumer contract, HELLO packet,
Result vectors, and Type-envelope vectors. `check-core-consumption.mjs` imports
no Core source, generator, script, or test. With only Node, ethers, these five
files, and the existing SDK semantic fixture, it independently:

- verifies raw SHA-256 locks and the exact committed source bytes;
- resolves every required shared and SDK JSON pointer;
- decodes, canonically re-encodes, and recommits the HELLO Result, all three
  Result vectors, and the embedded Bytes payload;
- preserves `uint64` values as decimal strings through the maximum value;
- recomputes the HELLO canonical-payload hash and Keccak-256 file digest;
- decodes, re-encodes, and recomputes IDs for four HELLO codec-0 Type
  envelopes plus the codec-0 and opaque codec-1 corpus entries; and
- rejects 13 stale-lock, malformed, narrowed, conflated, or semantically
  substituted mutations.

`core-source-lock-v0.json` is deliberately role-neutral and contains no SDK,
Explorer, time, host, architecture, or environment field. Its raw SHA-256 is
`c750a63b248d5a9a24d591046aa439d4e1b2eb07b127d49d734700b3048a2858`.
`sdk-consumption-v0.json` carries SDK-specific conclusions separately at raw
SHA-256
`ef8ba1b09f42f8287b2e4ab9a87ef30a6e3d2e5af98cccb7f2bf06c2c1799f7b`.

Run:

```sh
node check.mjs
node check-core-consumption.mjs
```

Expected outputs:

```text
PASS 6 EXP-C0 SDK MVP preservation cases
PASS 5 Core artifacts, 4 Result encodings, 6 Type envelopes, 13 mutations
```

This does not adopt the candidate ABI, Type bytes, IDs, domains, enum numbers,
limits, package topology, deployment, or helper. It executes no Core trace,
publishes no SDK package, and authorizes no freeze or deployment. Plan-signature
verification, account authorization/submission, and canonical effect read-back
remain three independently named receipts.
