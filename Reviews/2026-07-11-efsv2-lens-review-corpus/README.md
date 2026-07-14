# EFS v2 lens review corpus

Point-in-time supporting material for the [EFS v2 lens architecture review](../2026-07-11-efsv2-lens-architecture-and-scale-review.md). This corpus is evidence for a design review, not production code or an Etched implementation proposal.

The [independent review log](./peer-review-log.md) records the material semantic, corpus, cost, red-team, and current-source challenges resolved before closure, plus the remaining measured freeze gates.

## Foundry benchmark

The isolated benchmark in `benchmark/` compares:

- naive `M × K` rich slot reads;
- a two-phase one-word head then rich-on-hit read;
- exact-position claimant rosters using full identities or venue-local ordinals;
- prototype per-author candidate-stream scans.

Run:

```sh
cd benchmark
forge test -vv
```

Recorded environment on 2026-07-11:

```text
Forge 1.7.1
Solidity 0.8.30
Osaka EVM
via-IR optimizer, 200 runs
```

Verified after the matched-workload amendment: **26 tests passed, 0 failed**.

```text
LensGas.t.sol sha256  cb425a9b8eb050f40ed606b4ca7d1bc66667743c220256e48adcea049158c467
foundry.toml sha256   1d00be3c8cfe120ff701f20729dd221df1a16098a3b45dc2cee701112fec4b1f
```

Important limitations:

- Setup writes and transaction intrinsic/calldata gas are excluded.
- The resolver returns a checksum rather than production result structures.
- The rich getter models three stored words; it is not the final EFS kernel ABI.
- The store models the current single-winner shape; it does not model optional same-slot collision evidence or the separate predecessor/head-set alternative.
- The model omits deny/advisory, expiry, equivocation, KEL proof, and full provenance work.
- The claimant corpus uses two live claimants per position.
- The added matched point tests compare naïve and roster resolvers over the same two-claimant/rank-10-winner positions; the original worst-case rows use a different absent/rank-99 corpus and are not ratio-comparable.
- Author-stream tests measure seeded scan/reconciliation work. Winner-carrier dedup is possible, but append-ordered streams do not thereby become globally sorted/top-N stateless directory pages.
- The review’s conclusions require rerunning the workload matrix against the actual v2 kernel and including persistent write/state costs.

The review contains the recorded gas table and the required extended benchmark matrix.
