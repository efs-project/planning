# SDK v2 `EXP-C0` MVP preservation fixture

**Status:** disposable source-only fixture; validates SDK adapter preservation, not Core or protocol conformance
**Source lock:** C0 semantic seal at planning commit `a68b00a`; this branch carries only the SDK handoff

`fixture.json` is intentionally human-readable candidate data. `check.mjs`
checks that each result retains the C0 outer envelope, that cursors include all
resume coordinates, and that the canonical-effect axis cannot gain a local
`EFFECT_REJECTED` value. It makes no hash, codec, ABI, provider, wallet,
transaction, contract, deployment, or independent-implementation claim.

Run:

```sh
node check.mjs
```

Expected output: `PASS 6 EXP-C0 SDK MVP preservation cases`.
