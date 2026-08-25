# Data Explorer `EXP-C0/v0` serialized-consumption packet

**Status:** commit-ready disposable consumer evidence; no protocol, product API, deployment, production, durability, or freeze claim
**Core source lock:** `b9088d6a24f4d40bcca6ba300523b25cc7c608d2`
**Core branch at handoff:** `origin/codex/v2-readiness-week`
**Handoff SHA-256:** `2e8d191e4dd7c2130378e09f3cbc5b71441906cbaa6c448c30139aafe9ec203d`
**Explorer receipt SHA-256:** `c750a63b248d5a9a24d591046aa439d4e1b2eb07b127d49d734700b3048a2858`
**Explorer report SHA-256:** `094c87a0650390065976dd51f097946eefb6be0c128d54861f2ee70fc914d1b3`

## Verdict

PASS for one narrow question: Data Explorer can consume the pinned C0 contract
as an independent guest application using only five serialized JSON artifacts.
The checker imports no Core source, scripts, tests, codec, resolver, verifier,
Lens reducer, wallet, account, Commons, hosted indexer, or OS service.

This is the clean-room prerequisite for Explorer experiments, not either
experiment itself. E1a is `NOT_PROVEN_BY_THIS_CONTRACT`; E1b and its runtime
dependency trace are both literally `NOT_RUN`. The packet does not establish
public-Realm reachability, browser behavior, cold reconstruction, real SDK
adapter behavior, proof verification, accessibility, or production fitness.

## Authority surface

The exact committed Core bytes in `inputs/` are the packet's only inputs:

| Local input | Committed Core path | SHA-256 |
| --- | --- | --- |
| `consumer-contract-v0.json` | `Reviews/2026-08-25-efs2-exp-c0-v0-control/consumer-contract-v0.json` | `7be0ca1c742fcc61d16316456e2e8937de50c6e6864a5533d24e614d2caee512` |
| `handoff-v0.json` | `Reviews/2026-08-25-efs2-exp-c0-v0-control/handoff-v0.json` | `2e8d191e4dd7c2130378e09f3cbc5b71441906cbaa6c448c30139aafe9ec203d` |
| `hello-files-v0.json` | `Reviews/2026-08-25-efs2-exp-c0-v0-control/hello-files-v0.json` | `8841b6cd3c831ddeb80331614f421b17e8211594888eb657754f65ee28fa6a3f` |
| `result-v0.json` | `Reviews/2026-08-25-efs2-exp-c0-v0-control/vectors/result-v0.json` | `9fbadbce871d3be5d8ed4fbd74c36d3f15f01b8923259b99d3b5104dd176f6bf` |
| `type-envelope-v0.json` | `Reviews/2026-08-25-efs2-exp-c0-v0-control/vectors/type-envelope-v0.json` | `773660ae883e6ae4ecc28f853c681e229564eb33b9de02f4d3ae668140587a65` |

`core-source-lock-v0.json` is the role-neutral same-source receipt required by
the consumer contract. It uses the exact `JSON.stringify(receipt) + LF`
serialization and retains every handoff artifact lock, including artifacts this
consumer does not copy. `explorer-consumption-v0.json` records the smaller
five-file local authority surface and Explorer-specific observations.

## Laws checked

- the input directory contains exactly the five authorized serialized files;
- every local byte hash matches the Core handoff;
- the HELLO payload hash, required JSON pointers, source receipt, and Explorer
  projection root are independently recomputed or cross-checked;
- direct guest remains useful without wallet, account, Commons, hosted indexer,
  or OS boot;
- raw `ResultV0`, canonical file bytes, raw Type envelopes, and opaque unknown
  Type bytes survive projection;
- `UNKNOWN` and `PARTIAL` remain explicit, independent qualification codes;
- pending Core commits are allowed only while drafting and rejected in
  `commit-ready` mode; and
- protocol conformance, durability, production readiness, deployment authority,
  and freeze authority remain literal `false`.

The adversarial tests independently mutate direct-guest dependencies, raw
Result bytes, raw Type envelopes, the input allowlist, and the source-lock
placeholder. They do not execute Core code.

The final source-lock review additionally compares all five copied files byte
for byte with `git show b9088d6a24f4d40bcca6ba300523b25cc7c608d2:<path>`.
That external Git comparison establishes the committed-source statement; the
clean-room checker itself deliberately has no repository or Git dependency.

## Files

- `inputs/` — exact committed serialized Core artifacts.
- `core-source-lock-v0.json` — compact role-neutral source receipt.
- `explorer-consumption-v0.json` — Explorer-specific preservation report.
- `check-consumption.mjs` — Node-standard-library-only clean-room checker.
- `check-consumption.test.mjs` — nine bounded positive/adversarial tests.

## Reproduce

From the planning worktree root:

```sh
node --test Reviews/2026-08-25-data-explorer-exp-c0-consumption/check-consumption.test.mjs
node Reviews/2026-08-25-data-explorer-exp-c0-consumption/check-consumption.mjs --mode commit-ready
node --check Reviews/2026-08-25-data-explorer-exp-c0-consumption/check-consumption.mjs
node --check Reviews/2026-08-25-data-explorer-exp-c0-consumption/check-consumption.test.mjs
```

The next evidence step is still E1a's deterministic fake Reader/UI arm. Only
after that arm passes should E1b run twice from independently cold browser
profiles through the real disposable SDK adapter: once by direct guest route
and once OS-hosted. This packet cannot substitute for either run.
