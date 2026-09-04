# Disposable MVP-C0 executable foundation

This is a local component experiment, **not EFS Core, valid genesis, authentic
admission, deployment attestation, permanent protocol bytes, or freeze approval**.
The binding laboratory choices are in [run-codec.md](run-codec.md). The test
host is mutable and permissionless; it cannot substitute for Core authority.
No sibling v1 contracts or SDK are used.

## Reproduce

Use Node 26.0.0, ethers 6.15.0, Foundry 1.7.1 commit
`4072e48705af9d93e3c0f6e29e93b5e9a40caed8`, and native solc 0.8.30 commit
`73712a01`. Set `EFS_C0_SOLC` to that local compiler executable (do not commit
your machine path). From this directory:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
node scripts/measure-carrier.mjs
```

The single check verifies pinned tools/settings, compiles and runs Solidity
tests first, then runs Node unit and live integration tests against fresh
`out/` ABIs. The measurement command builds before running and writes
[artifacts/carrier-measurements.json](artifacts/carrier-measurements.json).
`npm test` alone requires the compiled artifacts; use `npm run check` first.
Local sandbox approval may be needed for loopback listening.

Each live command starts one temporary Anvil process bound to `127.0.0.1` on
an ephemeral port, Cancun, chain 31337, block gas limit 30,000,000, transaction
gas bound 29,000,000, normal EIP-170 code-size limits. No remote/forked RPC,
external wallet, saved chain state, or deployment is used. Signers are unlocked
local test accounts; output suppresses keys. Cleanup runs on failure/signal and
has a finite watchdog. The integrated measurement subtest restores an in-memory
snapshot before the independent recovery/gate experiments.

## What ran

- Independent Node/Solidity packed seed/deployment byte and domain-hash parity.
  Every value in the seed parity case is synthetic, not genesis evidence.
- Independently authored JS ChunkTree/body/Stage A RecordId computation checked
  against the separately cast-derived [literal vectors](fixtures/chunk-tree-known.json),
  including odd-tail promotion versus wrong duplicate-last/sorted-pair roots.
- Real carrier storage and serialized state recovery after original payload
  buffers are overwritten and dropped. The reader takes an expected frozen Type,
  explicit block number and local cap; it fetches metadata and the full file at
  that block, recomputes the complete tree/ID, then permits range slicing.
  The chain's retained state is the recovery source, not transaction logs.
- Empty versus missing, multiple chunks/partial final chunks, corrupted bytes
  and metadata, checked ranges, idempotent puts, initialization/put rollback,
  non-runtime phases, changed host context, and altered deployment runtime hashes.
- Observed runtime hashes match the local deployed code. CREATE init-code hashes
  come from actual deployment transaction data, but these are ordinary CREATE
  deployments with placeholder salts, **not CREATE2 provenance verification**.

These are RPC observations, not account/storage proofs. Raw `readRange` bytes
alone are not a Merkle proof; the reference reader verifies the complete bounded
file. No admission, File or Locator identity is invented by this experiment.

## Measurement interpretation

Candidate payload sizes are `[0,1,4096,8192,12289]`. The disclosed laboratory
file cap is 16,384 bytes and range cap is 4,096 bytes; neither is a selected
valid C0 cap. All samples are inserted once into one initially empty carrier.

The report records receipt `gasUsed` for host-forwarded writes and deliberately
sent full/range read-method **local test transactions**, including intrinsic
transaction gas. It does not report `eth_estimateGas` as observed gas. Ordinary
product reads remain RPC calls and need no wallet transaction. Gas excludes
Core admission and genesis overhead; these costs are not representative of a
complete Core transaction. Runtime deployment byte counts are also recorded.

`storedPayloadBytes` counts unique payload bytes only, not metadata, inventory,
storage slots or total state growth. Response sizes separately count returned
payload and ABI result bytes, not JSON-RPC wire bytes. Transaction hashes refer
to an already-discarded ephemeral chain; reproduce the run to obtain new local
observations. The report discloses tools, effective gas bounds, code hashes,
per-sample receipts, recovery basis, and coverage. **Do not hash this partial
report into a purported valid experimentSeed.**

## Still NOT_RUN and next input task

Complete capability/Codex constants and all 16 exact Type blobs; real Core and
SR-17 execution; group/reference structural admission; grant budgets/authority;
G0–G12 proofs and roots; BindingScope; Files mutations; real signatures; and all
nine browser/Core journeys remain NOT_RUN. Full cold-read/proof/client-memory
budgets, full-Core overhead, total storage footprint and formal cap selection
remain unmeasured. No source/toolchain manifest completeness or valid genesis
is claimed by synthetic fixtures or the host.

The next input task is to assemble and independently check the **complete
capability/Codex and 16 exact Type blobs plus real Core admission inputs** from
the owner-ratified sources, retaining unsettled mechanisms and authority gates.
Only that complete input path can support later Core/genesis and full-budget
experiments; this component result does not reopen permanent design choices.
